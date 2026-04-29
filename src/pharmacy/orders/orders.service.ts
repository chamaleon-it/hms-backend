import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderStatus } from './schemas/order.schema';
import mongoose, { Model } from 'mongoose';
import { PackedDto } from './dto/packed.dto';
import { MarkAllAsPackedDto } from './dto/markAllAsPacked.dto copy';
import { ItemsService } from '../items/items.service';
import { UpdateOrderDto } from './dto/UpdateOrder.dto';
import { BillingService } from 'src/billing/billing.service';
import { UsersService } from 'src/users/users.service';
import configuration from 'src/config/configuration';
import { Patient, PatientStatus } from 'src/patients/schemas/patient.schema';
import { GetCustomersDto } from './dto/get-customers.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Billing } from 'src/billing/schemas/billing.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    private readonly itemsService: ItemsService,
    private readonly billingService: BillingService,
    private readonly usersService: UsersService,
  ) { }

  private async generateUniqueMRN(): Promise<string> {
    let mrn: string;
    let exists = true;

    do {
      const randomNum = Math.floor(1000000 + Math.random() * 9000000);
      mrn = `RX${randomNum}`;
      const existing = await this.orderModel.exists({ mrn });
      exists = !!existing;
    } while (exists);

    return mrn;
  }

  async createOrder(order: CreateOrderDto) {
    const mrn = await this.generateUniqueMRN();
    order.mrn = mrn;
    const data = await this.orderModel.create(order);
    const { autoGenerateBill } = await this.usersService.getPharmacyBilling(
      configuration().in_house_pharmacy_id,
    );
    if (autoGenerateBill) {
      const items = await Promise.all(
        order.items.map(async (item) => {
          const itemData = await this.itemsService.getItem(item.name);

          const unitPrice = itemData.unitPrice;
          const quantity = item.quantity;

          return {
            name: itemData.name,
            unitPrice,
            quantity,
            discount: 0,
            gst: 0,
            total: unitPrice * quantity,
          };
        }),
      );

      const bill = await this.billingService.generateBill({
        patient: order.patient,
        items,
        user: new mongoose.Types.ObjectId(configuration().in_house_pharmacy_id),
        discount: order.discount ?? 0,
      });

      data.billNo = bill.mrn;

      if (order.allergies) {
        await this.patientModel.findByIdAndUpdate(order.patient, {
          allergies: order.allergies,
        });
      }
      await data.save();
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
    } else if (q === OrderStatus.Filling) {
      filter.status = OrderStatus.Filling;
    } else if (q === OrderStatus.Ready) {
      filter.status = OrderStatus.Ready;
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
        .populate('doctor', 'name phoneNumber specialization')
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
      .populate('doctor', 'name phoneNumber specialization')
      .populate('items.name')
      .lean();

    if (!data) {
      throw new NotFoundException('Order not found.');
    }

    return data;
  }

  async itemPacked(
    packedDto: PackedDto,
    user: mongoose.Types.ObjectId,
  ): Promise<void> {
    const { order: orderId, item } = packedDto;

    const order = await this.orderModel
      .findOneAndUpdate(
        { _id: orderId, 'items.name': item },
        { $set: { 'items.$.isPacked': true, status: OrderStatus.Filling } },
        { new: true },
      )
      .exec();

    if (!order) {
      throw new NotFoundException(
        'Order or item not found. Please check your details.',
      );
    }

    const isFullyPacked = order.items.every((it) => Boolean(it.isPacked));
    if (isFullyPacked && order.status !== OrderStatus.Ready) {
      order.status = OrderStatus.Ready;
      await order.save();
    }
    const qty =
      order.items.find((e) => String(e.name) === String(item))?.quantity ?? 0;
    await this.itemsService.decreaseItem(item, qty, user);
  }

  async markAllAsPacked(
    markAllAsPackedDto: MarkAllAsPackedDto,
    user: mongoose.Types.ObjectId,
  ): Promise<void> {
    const orderId = markAllAsPackedDto.order;
    const order = await this.orderModel.findById(orderId).lean().exec();
    if (!order) {
      throw new NotFoundException(
        'Order not found. Please check your details.',
      );
    }
    const unpacked = (order.items ?? []).filter((i) => !i.isPacked);

    if (unpacked.length > 0) {
      await Promise.all(
        unpacked.map((it) =>
          this.itemsService.decreaseItem(it.name, it.quantity, user),
        ),
      );
    }

    const result = await this.orderModel
      .updateOne(
        { _id: orderId },
        {
          $set: {
            'items.$[].isPacked': true,
            status: OrderStatus.Ready,
          },
        },
      )
      .exec();

    if (result.matchedCount === 0) {
      throw new NotFoundException(
        'Order not found. Please check your details.',
      );
    }
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
      patientFilter.gender =
        gender === 'Other' ? { $nin: ['Male', 'Female'] } : gender;
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
        acc + (bill.cash ?? 0) + (bill.online ?? 0) + (bill.insurance ?? 0)
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

  updateOrder(dto: UpdateOrderDto) {
    const order = this.orderModel
      .findByIdAndUpdate(dto._id, dto, { new: true, runValidators: true })
      .lean();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async completeOrder(id: mongoose.Types.ObjectId) {
    const data = await this.orderModel
      .findByIdAndUpdate(id, { status: OrderStatus.Completed }, { new: true })
      .lean();
    if (!data) {
      throw new NotFoundException('Order not found');
    }

    return data;
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
    newOrder.items = existOrder.items.map((item) => {
      return {
        ...item,
        isPacked: false,
      };
    });
    newOrder.priority = existOrder.priority;
    newOrder.discount = existOrder.discount;
    newOrder.assignedTo = existOrder.assignedTo;
    const data = await this.orderModel.create(newOrder);


    if (true) {
      const items = await Promise.all(
        data.items.map(async (item) => {
          const itemData = await this.itemsService.getItem(item.name);

          const unitPrice = itemData.unitPrice;
          const quantity = item.quantity;

          return {
            name: itemData.name,
            unitPrice,
            quantity,
            discount: 0,
            gst: 0,
            total: unitPrice * quantity,
          };
        }),
      );

      await this.billingService.generateBill({
        patient: data.patient,
        items,
        user: new mongoose.Types.ObjectId(configuration().in_house_pharmacy_id),
        discount: data.discount ?? 0,
      });
    }

    return data;
  }

  async updatePayment(dto: UpdatePaymentDto) {
    const data = await this.orderModel
      .findByIdAndUpdate(dto.orderId, dto, { new: true, runValidators: true })
      .populate('patient')
      .populate('doctor', 'name phoneNumber specialization')
      .populate('items.name')
      .lean();

    if (data?.billNo) {
      await this.billingModel
        .findOneAndUpdate(
          { mrn: data?.billNo },
          { cash: data.paidAmount },
          { new: true, runValidators: true },
        )
        .lean();
    }

    if (!data) {
      throw new NotFoundException('Order not found');
    }
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
