import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument, OrderStatus, PaymentStatus } from './schemas/order.schema';
import mongoose, { Model } from 'mongoose';
import { ItemsService, SaleContext } from '../items/items.service';
import { UpdateOrderDto } from './dto/UpdateOrder.dto';
import { BillingService } from 'src/billing/billing.service';
import { CreateBillingItemDto } from 'src/billing/dto/create-billing.dto';
import { UsersService } from 'src/users/users.service';
import { getInHouseObjectId, requireInHouseId } from 'src/config/in-house';
import { Patient, PatientStatus } from 'src/patients/schemas/patient.schema';
import { GetCustomersDto } from './dto/get-customers.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { CompleteOrderDto } from './dto/complete-order.dto';
import { Billing } from 'src/billing/schemas/billing.schema';
import {
  COUNTER_KEYS,
  CountersService,
} from 'src/counters/counters.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    private readonly itemsService: ItemsService,
    private readonly billingService: BillingService,
    private readonly usersService: UsersService,
    private readonly countersService: CountersService,
  ) {
    this.countersService.registerBootSeed(COUNTER_KEYS.PHARMACY_ORDER, () =>
      this.maxOrderSeq(),
    );
  }

  private async maxOrderSeq(): Promise<number> {
    const last = await this.orderModel
      .findOne({ mrn: { $regex: /^RX\d+$/ } })
      .collation({ locale: 'en_US', numericOrdering: true })
      .sort({ mrn: -1 })
      .select('mrn')
      .lean()
      .exec();
    if (!last?.mrn) return 0;
    const match = String(last.mrn).match(/^RX(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private async generateUniqueMRN(): Promise<string> {
    return this.countersService.nextFormatted(COUNTER_KEYS.PHARMACY_ORDER, {
      prefix: 'RX',
      pad: 7,
      getInitialMax: () => this.maxOrderSeq(),
    });
  }

  private async saleContext(order: {
    _id: mongoose.Types.ObjectId;
    patient: mongoose.Types.ObjectId;
    mrn: string;
    billNo?: string;
  }): Promise<SaleContext> {
    const patient = await this.patientModel
      .findById(order.patient)
      .select('name mrn phoneNumber')
      .lean()
      .exec();
    return {
      orderId: order._id,
      orderNumber: order.mrn,
      billNumber: order.billNo && order.billNo !== '-' ? order.billNo : undefined,
      customerId: order.patient,
      customerName: patient?.name,
      customerNumber: patient?.mrn,
      customerPhone: patient?.phoneNumber,
    };
  }

  async createOrder(order: CreateOrderDto) {
    if (order.clientRequestId) {
      const existing = await this.orderModel.findOne({ clientRequestId: order.clientRequestId }).exec();
      if (existing) {
        if (String(existing.patient) !== String(order.patient)) {
          throw new BadRequestException('Order request ID is already in use');
        }
        return existing;
      }
    }
    const mrn = await this.generateUniqueMRN();
    order.mrn = mrn;

    // Validate batch selection / stock before create (registered + walk-in share this path)
    for (const item of order.items || []) {
      const batchInfo = await this.itemsService.getItemBatches(
        item.name,
        'fefo',
        true,
        true, // include inactive so we can reject with a clear message
      );
      const availableBatches = (batchInfo.batches || []).filter(
        (b) =>
          !b.expired &&
          b.available !== false &&
          b.status !== 'inactive' &&
          b.stock > 0,
      );

      // When stocked batches exist, force an explicit batch pick (no silent FEFO)
      if (availableBatches.length > 0 && !item.batchId) {
        throw new BadRequestException(
          `Batch selection is required for ${batchInfo.name}`,
        );
      }

      if (item.batchId) {
        const batch = batchInfo.batches.find(
          (b) =>
            String(b.batchId) === String(item.batchId) ||
            String(b.batchNumber || '').toLowerCase() ===
              String(item.batchId).toLowerCase() ||
            (item.batchNumber &&
              String(b.batchNumber || '').toLowerCase() ===
                String(item.batchNumber).toLowerCase()),
        );
        if (!batch) {
          throw new BadRequestException(
            `Selected batch not found for item ${batchInfo.name}`,
          );
        }
        if (batch.status === 'inactive') {
          throw new BadRequestException(
            `Cannot order from inactive batch ${batch.batchNumber}`,
          );
        }
        if (batch.expired) {
          throw new BadRequestException(
            `Cannot order from expired batch ${batch.batchNumber}`,
          );
        }
        if ((batch.stock || 0) <= 0) {
          throw new BadRequestException(
            `Batch ${batch.batchNumber} has zero stock`,
          );
        }
        const allowNeg =
          await this.usersService.getPharmacyInventoryAllowNegativeStock(
            getInHouseObjectId('pharmacy'),
          );
        if (!allowNeg && batch.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient batch stock for ${batchInfo.name} (${batch.batchNumber}). Available: ${batch.stock}`,
          );
        }
        // Freeze snapshot fields on the order line (prefer batch unitPrice)
        item.batchNumber = item.batchNumber || batch.batchNumber;
        item.batchExpiryDate = item.batchExpiryDate || batch.expiryDate;
        item.batchMrp = item.batchMrp ?? batch.mrp;
        item.batchPurchasePrice =
          item.batchPurchasePrice ?? batch.purchaseRate;
        item.batchSellingPrice =
          item.batchSellingPrice ?? batch.unitPrice;
        item.batchGst = item.batchGst ?? batch.gst;
        item.batchStock = item.batchStock ?? batch.stock;
        item.batchSupplier = item.batchSupplier || batch.supplier;
        item.batchPacking = item.batchPacking ?? batch.packing;
      }
    }

    // Only these fields may be persisted on creation. In particular, callers
    // cannot supply Completed, payment state, or a bill number.
    const newOrder = {
      clientRequestId: order.clientRequestId,
      mrn,
      patient: order.patient,
      doctor: order.doctor,
      doctorName: order.doctorName,
      items: order.items,
      priority: order.priority,
      status: OrderStatus.Pending,
      discount: order.discount ?? 0,
      assignedTo: order.assignedTo,
      pharmacist: order.pharmacist,
    };
    let data: any;
    try {
      data = await this.orderModel.create(newOrder);
    } catch (error: any) {
      if (error?.code === 11000 && order.clientRequestId) {
        const existing = await this.orderModel.findOne({ clientRequestId: order.clientRequestId }).exec();
        if (existing) {
          if (String(existing.patient) !== String(order.patient)) {
            throw new BadRequestException('Order request ID is already in use');
          }
          return existing;
        }
      }
      throw error;
    }
    return data;
  }

  async getOrders(query: GetOrdersDto) {
    const { page = 1, limit = 20, q } = query;
    const skip = (page - 1) * limit;

    const filter: {
      status?: Record<string, string> | string;
      priority?: string;
      isDeleted?: boolean;
      createdAt?: Record<string, Date>;
    } = {};

    if (query.startDate && query.endDate) {
      filter.createdAt = {
        $gte: query.startDate,
        $lte: query.endDate,
      };
    }

    filter.isDeleted = false;

    if (q === OrderStatus.Pending) {
      filter.status = OrderStatus.Pending;
    } else if (q === OrderStatus.Completed) {
      filter.status = OrderStatus.Completed;
    } else if (q === 'Deleted') {
      filter.isDeleted = true;
    }

    const [data, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .populate('patient')
        .populate('doctor', 'name phoneNumber specialization qualification designation')
        .populate('items.name')
        .sort({ createdAt: -1 })
        .exec(),
      this.orderModel.countDocuments(filter),
    ]);

    return { data, total };
  }

  async deleteOrder(id: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id))
      throw new BadRequestException(
        'Order id is not valid. Please check your order id.',
      );

    const data = await this.orderModel
      .findByIdAndUpdate(
        id,
        {
          isDeleted: true,
        },
        { new: true, runValidators: true },
      )
      .lean();

    if (!data) {
      throw new BadRequestException(
        'Sorry, the order doesn’t exist. Please check your order details.',
      );
    }
    return data;
  }

  async getSingleOrder(q: string) {
    const searchRegex = { $regex: '^' + q, $options: 'i' };

    const filter = {
      $or: [{ mrn: searchRegex }, { billNo: searchRegex }],
    };

    const data = await this.orderModel
      .findOne(filter)
      .populate('patient')
      .populate('doctor', 'name phoneNumber specialization qualification designation')
      .populate('items.name')
      .lean();

    if (!data) {
      throw new NotFoundException('Order not found.');
    }

    // Item master no longer stores unitPrice/qty — attach batch-derived display fields
    if (Array.isArray(data.items)) {
      data.items = data.items.map((line: any) => ({
        ...line,
        name: line?.name ? this.itemsService.enrichItem(line.name) : line?.name,
      }));
    }

    return data;
  }

  async getCustomers(query: GetCustomersDto) {
    const {
      page = 1,
      limit = 10,
      alreadyPurchase = 'true',
      q,
      gender,
      doctor,
      lastVisit,
      from,
      to,
      age,
    } = query;
    const skip = (page - 1) * limit;

    const patientFilter: any = { status: { $ne: PatientStatus.DELETED } };

    if (q) {
      const searchRegex = { $regex: q, $options: 'i' };
      const orConditions: any[] = [
        { name: searchRegex },
        { phoneNumber: searchRegex },
        { address: searchRegex },
        { mrn: searchRegex },
      ];
      if (mongoose.isValidObjectId(q)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(q) });
      }
      patientFilter.$or = orConditions;
    }

    if (gender) {
      patientFilter.gender = gender;
    }

    if (doctor && alreadyPurchase === 'false') {
      patientFilter.doctor = new mongoose.Types.ObjectId(doctor);
    }

    if (age) {
      const [minAge, maxAge] = age.split('-').map(Number);
      if (!isNaN(minAge) && !isNaN(maxAge)) {
        const now = new Date();
        const minDate = new Date(
          now.getFullYear() - maxAge - 1,
          now.getMonth(),
          now.getDate(),
        );
        const maxDate = new Date(
          now.getFullYear() - minAge,
          now.getMonth(),
          now.getDate(),
        );
        patientFilter.dateOfBirth = { $gte: minDate, $lte: maxDate };
      }
    }

    let patientIds: mongoose.Types.ObjectId[] | null = null;
    let total = 0;

    const billingMatch: any = {
      patient: { $exists: true, $ne: null },
      transactionType: 'Sale',
    };

    if (lastVisit) {
      let dateLimit: Date | null = null;
      const now = new Date();
      if (lastVisit === '7') {
        dateLimit = new Date(now.setDate(now.getDate() - 7));
      } else if (lastVisit === '30') {
        dateLimit = new Date(now.setDate(now.getDate() - 30));
      } else if (lastVisit === 'Custom' && from && to) {
        billingMatch.createdAt = {
          $gte: new Date(from),
          $lte: new Date(to),
        };
      }

      if (dateLimit) {
        billingMatch.createdAt = { $gte: dateLimit };
      }
    }

    if (alreadyPurchase === 'true') {
      const aggregationPipeline: any[] = [
        { $match: billingMatch },
        {
          $group: {
            _id: '$patient',
            lastPurchaseDate: { $max: '$createdAt' },
          },
        },
        {
          $lookup: {
            from: 'patients',
            localField: '_id',
            foreignField: '_id',
            as: 'patientDetail',
          },
        },
        { $unwind: '$patientDetail' },
        { $match: { 'patientDetail.status': { $ne: PatientStatus.DELETED } } },
      ];

      if (doctor) {
        aggregationPipeline.push({
          $match: {
            'patientDetail.doctor': new mongoose.Types.ObjectId(doctor),
          },
        });
      }

      if (q) {
        const searchRegex = { $regex: q, $options: 'i' };
        aggregationPipeline.push({
          $match: {
            $or: [
              { 'patientDetail.name': searchRegex },
              { 'patientDetail.phoneNumber': searchRegex },
              { 'patientDetail.address': searchRegex },
              { 'patientDetail.mrn': searchRegex },
            ],
          },
        });
        if (mongoose.isValidObjectId(q)) {
          (
            aggregationPipeline[aggregationPipeline.length - 1].$match
              .$or as any[]
          ).push({
            'patientDetail._id': new mongoose.Types.ObjectId(q),
          });
        }
      }

      if (gender) {
        aggregationPipeline.push({
          $match: { 'patientDetail.gender': gender },
        });
      }

      if (age) {
        const [minAge, maxAge] = age.split('-').map(Number);
        if (!isNaN(minAge) && !isNaN(maxAge)) {
          const now = new Date();
          const minDate = new Date(
            now.getFullYear() - maxAge - 1,
            now.getMonth(),
            now.getDate(),
          );
          const maxDate = new Date(
            now.getFullYear() - minAge,
            now.getMonth(),
            now.getDate(),
          );
          aggregationPipeline.push({
            $match: {
              'patientDetail.dateOfBirth': { $gte: minDate, $lte: maxDate },
            },
          });
        }
      }

      const countResult = await this.billingModel.aggregate([
        ...aggregationPipeline,
        { $count: 'total' },
      ]);
      total = countResult[0]?.total ?? 0;

      const result = await this.billingModel.aggregate([
        ...aggregationPipeline,
        { $sort: { lastPurchaseDate: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]);

      patientIds = result.map((item) => item._id);
    } else {
      total = await this.patientModel.countDocuments(patientFilter);
    }

    let patients: any[] = [];

    if (alreadyPurchase === 'true') {
      if (patientIds && patientIds.length > 0) {
        const patientsUnordered = await this.patientModel
          .find({ _id: { $in: patientIds } })
          .lean()
          .exec();

        const patientMap = new Map(
          patientsUnordered.map((p) => [p._id.toString(), p]),
        );
        patients = patientIds
          .map((id) => patientMap.get(id.toString()))
          .filter((p) => !!p) as any[];
      } else {
        return { data: [], total: 0 };
      }
    } else {
      patients = await this.patientModel
        .find(patientFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();
    }

    const bills: any[] = await this.billingModel
      .find({
        patient: { $in: patients.map((e) => e._id) },
      })
      .lean()
      .exec();

    const data = patients.map((e) => {
      const patientBills = bills.filter(
        (i) =>
          i.patient.toString() === e._id.toString() &&
          i.transactionType === 'Sale',
      );
      patientBills.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const totalSpend: number = patientBills.reduce(
        (a, b) => a + (b.items?.reduce((c, d) => c + (d.total || 0), 0) || 0),
        0,
      );

      return {
        totalSpend,
        visits: patientBills.length,
        patient: e,
        lastPurchase: patientBills[0]?.createdAt ?? null,
      };
    });

    return { data, total };
  }

  async getCustomer(patientId: mongoose.Types.ObjectId) {
    const [sampleBill, bills] = await Promise.all([
      this.billingModel
        .findOne({ patient: patientId })
        .populate('patient')
        .select('patient')
        .lean()
        .exec(),
      this.billingModel
        .find({ patient: patientId })
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
    ]);

    const patient = sampleBill?.patient ?? null;

    if (!patient) {
      throw new NotFoundException('This patient has not purchased any items.');
    }

    const salesOnly = bills.filter((b) => b.transactionType === 'Sale');
    const totalVisit = salesOnly.length;

    const totalSpend: number = salesOnly.reduce((acc, bill: any) => {
      const billTotal = (bill.items || []).reduce(
        (itemAcc, item) => itemAcc + (item.total || 0),
        0,
      );
      return acc + billTotal - (bill.discount || 0);
    }, 0);

    const averageSpend = totalVisit > 0 ? totalSpend / totalVisit : 0;
    const lastPurchase: Date | null = (salesOnly[0] as any)?.createdAt ?? null;

    const totalPaid = bills.reduce((acc, bill) => {
      return (
        acc + (bill.cash ?? 0) + (bill.online ?? 0)
      );
    }, 0);

    const itemsTotal = salesOnly.reduce(
      (acc, bill) =>
        acc +
        (bill.items || []).reduce((iAcc, i) => iAcc + (i.total || 0), 0) -
        (bill.discount || 0),
      0,
    );
    const totalDue = itemsTotal - totalPaid;

    return {
      patient,
      orders: bills,
      totalVisit,
      averageSpend,
      totalSpend,
      lastPurchase,
      totalPaid,
      totalDue,
    };
  }

  async updateOrder(dto: UpdateOrderDto) {
    const current = await this.orderModel.findById(dto._id).lean().exec();
    if (!current) throw new NotFoundException('Order not found');
    if (current.status !== OrderStatus.Pending) {
      throw new BadRequestException('Only pending orders can be edited');
    }
    const payload: Record<string, any> = {};
    for (const field of ['doctor', 'doctorName', 'priority', 'assignedTo', 'pharmacist', 'discount'] as const) {
      if ((dto as any)[field] !== undefined) payload[field] = (dto as any)[field];
    }

    if (Array.isArray(dto.items)) {
      payload.items = [];
      for (const raw of dto.items) {
        const line: any = { ...raw };
        // FE often sends populated item master; persist ObjectId only
        const nameRef = (raw as any)?.name;
        if (nameRef && typeof nameRef === 'object') {
          line.name = nameRef._id || nameRef.id;
        }
        if (line.batchId || line.batchNumber) {
          const itemId = line.name;
          const batchInfo = await this.itemsService.getItemBatches(
            itemId,
            'fefo',
            true,
            true,
          );
          const batch = (batchInfo.batches || []).find(
            (b) =>
              String(b.batchId) === String(line.batchId) ||
              String(b.batchNumber || '').toLowerCase() ===
                String(line.batchId || '').toLowerCase() ||
              (line.batchNumber &&
                String(b.batchNumber || '').toLowerCase() ===
                  String(line.batchNumber).toLowerCase()),
          );
          if (!batch) {
            throw new BadRequestException(
              `Selected batch not found for item ${batchInfo.name}`,
            );
          }
          // Re-bind to persisted batchId so completion uses the selected batch.
          line.batchId = batch.batchId;
          line.batchNumber = line.batchNumber || batch.batchNumber;
          line.batchExpiryDate = line.batchExpiryDate || batch.expiryDate;
          line.batchMrp = line.batchMrp ?? batch.mrp;
          line.batchPurchasePrice =
            line.batchPurchasePrice ?? batch.purchaseRate;
          line.batchSellingPrice =
            line.batchSellingPrice ?? batch.unitPrice;
          line.batchGst = line.batchGst ?? batch.gst;
          line.batchStock = line.batchStock ?? batch.stock;
          line.batchSupplier = line.batchSupplier || batch.supplier;
          line.batchPacking = line.batchPacking ?? batch.packing;
        }

        payload.items.push(line);
      }
    }

    const match: Record<string, unknown> = {
      _id: dto._id,
      status: OrderStatus.Pending,
      ...((current as any).updatedAt ? { updatedAt: (current as any).updatedAt } : {}),
    };
    const order = await this.orderModel
      .findOneAndUpdate(
        match,
        payload,
        { new: true, runValidators: true },
      )
      .lean();
    if (!order) {
      throw new BadRequestException('Order changed while editing. Refresh and retry');
    }
    return order;
  }

  async completeOrder(
    id: mongoose.Types.ObjectId,
    userId?: mongoose.Types.ObjectId,
    dto?: CompleteOrderDto,
  ) {
    let current = await this.orderModel.findById(id).exec();
    if (!current) throw new NotFoundException('Order not found');
    if (current.status === OrderStatus.Completed) return current;
    if (current.status !== OrderStatus.Pending) {
      throw new BadRequestException('Only pending orders can be completed');
    }

    // Save edits before the sale transaction. A failed sale leaves the order
    // editable, while the transaction keeps stock and completion together.
    if (dto?.items) {
      await this.updateOrder({ _id: id, items: dto.items, discount: dto.discount } as UpdateOrderDto);
      current = await this.orderModel.findById(id).exec();
      if (!current) throw new NotFoundException('Order not found');
    }

    // Legacy imported batches may lack persistent subdocument IDs. Heal them
    // before taking a transaction snapshot so the sale sees the same IDs.
    for (const line of current.items || []) {
      await this.itemsService.ensurePersistedBatchIds(line.name);
    }

    const autoGenerateBill = userId
      ? (await this.usersService.getPharmacyBilling(requireInHouseId('pharmacy'))).autoGenerateBill
      : false;

    let order: OrderDocument | null = null;
    const session = await this.orderModel.db.startSession();
    try {
      await session.withTransaction(async () => {
        // Claim the pending order in the same transaction as all stock writes.
        // Concurrent Complete requests cannot each make a sale.
        order = await this.orderModel.findOneAndUpdate(
          { _id: id, status: OrderStatus.Pending },
          { $set: { status: OrderStatus.Completed } },
          { new: true, session },
        ).exec();
        if (!order) {
          const existing = await this.orderModel.findById(id).session(session).exec();
          if (!existing) throw new NotFoundException('Order not found');
          if (existing.status !== OrderStatus.Completed) {
            throw new BadRequestException('Only pending orders can be completed');
          }
          order = existing;
          return;
        }

        if (!order.items?.length) throw new BadRequestException('Order has no items');
        const sale = await this.saleContext(order);
        for (const [index, line] of order.items.entries()) {
          if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
            throw new BadRequestException(`Item ${index + 1} has an invalid quantity`);
          }
          const itemId = line.name as mongoose.Types.ObjectId;
          const resolved = await this.itemsService.resolveBatchForSale(
            itemId, line.batchId || null, line.batchNumber || null,
          );
          if (!resolved && (line.batchId || line.batchNumber)) {
            throw new BadRequestException(`Selected batch not found for item ${index + 1}`);
          }
          if (resolved && (
            (line.batchNumber && resolved.batchNumber.toLowerCase() !== line.batchNumber.toLowerCase()) ||
            (line.batchId && !line.batchNumber &&
              resolved.batchId !== line.batchId &&
              resolved.batchNumber.toLowerCase() !== line.batchId.toLowerCase())
          )) {
            throw new BadRequestException(`Selected batch changed for item ${index + 1}`);
          }
          await this.itemsService.decreaseItem(
            itemId,
            line.quantity,
            userId,
            resolved?.batchId || null,
            resolved?.batchNumber || null,
            { ...sale, saleKey: `${order._id}:${index}`, unitPrice: line.batchSellingPrice ?? undefined },
            session,
          );
          if (resolved) {
            line.batchId = resolved.batchId;
            line.batchNumber = resolved.batchNumber;
          }
        }
        if (autoGenerateBill || (order.billNo && order.billNo !== '-')) {
          const billItems: CreateBillingItemDto[] = [];
          for (const line of order.items) {
            const itemData = await this.itemsService.getItem(line.name);
            const unitPrice = line.batchSellingPrice ?? this.itemsService.resolveItemUnitPrice(itemData);
            billItems.push({
              name: itemData.name,
              unitPrice,
              quantity: line.quantity,
              discount: 0,
              total: unitPrice * line.quantity,
              itemId: line.name,
              batchId: line.batchId || undefined,
              batchNumber: line.batchNumber || undefined,
              expiryDate: line.batchExpiryDate || undefined,
              mrp: line.batchMrp ?? undefined,
              purchasePrice: line.batchPurchasePrice ?? undefined,
              gst: line.batchGst ?? undefined,
              supplier: line.batchSupplier || undefined,
              packing: line.batchPacking ?? undefined,
            });
          }
          if (order.billNo && order.billNo !== '-') {
            const existingBill = await this.billingModel.findOne({
              mrn: order.billNo,
              transactionType: 'Sale',
              patient: order.patient,
            }).session(session).exec();
            if (!existingBill) throw new BadRequestException('Linked order bill was not found.');

            // The order contains medicines only. Keep consultation, procedure and
            // other manually added bill lines when refreshing its medicine lines.
            const medicineNames = new Set(billItems.map(item => item.name.trim().toLowerCase()));
            const otherItems = existingBill.items.filter(item =>
              !item.itemId && !medicineNames.has(item.name.trim().toLowerCase()),
            );
            const updatedItems = [...billItems, ...otherItems];
            const discount = order.discount ?? 0;
            const payable = Math.round((updatedItems.reduce((sum, item) => sum + (item.total || 0), 0) -
              discount) * 100) / 100;
            const paid = Math.round(((existingBill.cash || 0) + (existingBill.online || 0) +
              (existingBill.card || 0) - (existingBill.refund || 0)) * 100) / 100;
            if (payable < 0) {
              throw new BadRequestException('Bill discount exceeds the updated bill total.');
            }
            if (paid > payable) {
              throw new BadRequestException(
                `Recorded payment (₹${paid.toFixed(2)}) exceeds the updated bill total (₹${payable.toFixed(2)}). Adjust the payment or order prices before completing.`,
              );
            }
            const bill = await this.billingModel.findOneAndUpdate(
              { _id: existingBill._id },
              { $set: { items: updatedItems, discount, doctor: order.doctorName || 'Self' } },
              { new: true, runValidators: true, session },
            );
            if (!bill) throw new BadRequestException('Bill changed while completing the order. Refresh and retry.');
            order.paidAmount = paid;
            order.paymentStatus = paid <= 0 ? PaymentStatus.Pending :
              paid >= payable ? PaymentStatus.Paid : PaymentStatus.Partial;
          } else {
            const bill = await this.billingService.generateBill({
              patient: order.patient,
              items: billItems,
              user: getInHouseObjectId('pharmacy'),
              discount: order.discount ?? 0,
              cash: order.paidAmount ?? 0,
              doctor: order.doctorName || 'Self',
            }, session);
            order.billNo = bill.mrn;
          }
        }
        await order.save({ session });
      });
    } finally {
      await session.endSession();
    }
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async repeatOrder(id: mongoose.Types.ObjectId) {

    const bill = await this.billingModel.findById(id).lean().exec();
    const existOrder = await this.orderModel.findOne({ billNo: bill?.mrn }).lean().exec();

    if (!existOrder) {
      throw new NotFoundException('Order not found');
    }
    const newOrder: any = {};
    const mrn = await this.generateUniqueMRN();
    newOrder.mrn = mrn;
    newOrder.patient = existOrder.patient;
    newOrder.doctor = existOrder.doctor;
    newOrder.doctorName = existOrder.doctorName;
    newOrder.items = existOrder.items;
    newOrder.priority = existOrder.priority;
    newOrder.discount = existOrder.discount;
    newOrder.assignedTo = existOrder.assignedTo;
    const data = await this.orderModel.create(newOrder);


    if (true) {
      const items = await Promise.all(
        data.items.map(async (item) => {
          const itemData = (await this.itemsService.getItem(item.name)) as any;

          const unitPrice = this.itemsService.resolveItemUnitPrice(itemData);
          const quantity = item.quantity;

          return {
            name: itemData.name,
            unitPrice,
            quantity,
            discount: 0,
            total: unitPrice * quantity,
          };
        }),
      );

      await this.billingService.generateBill({
        patient: data.patient,
        items,
        user: getInHouseObjectId('pharmacy'),
        discount: data.discount ?? 0,
        doctor: existOrder.doctorName || "Self",
        rxId: data.mrn,
      });
    }

    return data;
  }

  async updatePayment(dto: UpdatePaymentDto) {
    if (!Number.isFinite(dto.paidAmount) || dto.paidAmount < 0) {
      throw new BadRequestException('Paid amount must be non-negative.');
    }
    const order = await this.orderModel.findById(dto.orderId);
    if (!order) throw new NotFoundException('Order not found');
    if (order.billNo && order.billNo !== '-') {
      const bill = await this.billingModel.findOne({ mrn: order.billNo });
      if (!bill) throw new BadRequestException('Linked order bill was not found.');
      const cash = Math.round((dto.paidAmount - (bill.online || 0) -
        (bill.card || 0) + (bill.refund || 0)) * 100) / 100;
      if (cash < 0) throw new BadRequestException('Paid amount is less than other recorded payments.');
      await this.billingService.addPayment(bill._id, {
        cash,
        online: bill.online || 0,
        card: bill.card || 0,
        refund: bill.refund || 0,
      }, bill.user);
    } else {
      const lineTotals = await Promise.all(order.items.map(async (item) => {
        const master = await this.itemsService.getItem(item.name);
        const price = item.batchSellingPrice ?? this.itemsService.resolveItemUnitPrice(master);
        return price * item.quantity;
      }));
      const total = lineTotals.reduce((sum, amount) => sum + amount, 0);
      const payable = Math.max(0, total - (order.discount || 0));
      if (dto.paidAmount > payable) {
        throw new BadRequestException('Payment exceeds the order balance.');
      }
      order.paidAmount = dto.paidAmount;
      order.paymentStatus = dto.paidAmount <= 0 ? PaymentStatus.Pending :
        dto.paidAmount >= payable ? PaymentStatus.Paid : PaymentStatus.Partial;
      if (dto.paymentReference) order.paymentReference = dto.paymentReference;
      await order.save();
    }
    const data = await this.orderModel
      .findById(dto.orderId)
      .populate('patient')
      .populate('doctor', 'name phoneNumber specialization qualification designation')
      .populate('items.name')
      .lean();
    return data;
  }

  async recoverOrder(id: mongoose.Types.ObjectId) {
    const data = await this.orderModel
      .findByIdAndUpdate(
        id,
        { isDeleted: false },
        { new: true, runValidators: true },
      )
      .lean();
    if (!data) {
      throw new NotFoundException('Order not found');
    }
    return data;
  }
}
