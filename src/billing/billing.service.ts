import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBillingDto, CreateBillingItemDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { EditPharmacyBillDto } from './dto/edit-pharmacy-bill.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Billing } from './schemas/billing.schema';
import mongoose, { Model } from 'mongoose';
import { GetBillisDto } from './dto/get-bills.dto';
import { AddBillingItemDto } from './dto/add-billing-item.dto';
import { BillingItem } from './schemas/billingItem.schema';
import { GetBillingItemDto } from './dto/get-billing-item.dto';
import { UsersService } from 'src/users/users.service';
import { AddPaymentDto } from './dto/add-payment.dto';
import { Order, PaymentStatus } from 'src/pharmacy/orders/schemas/order.schema';
import { UpdateBillingItemDto } from './dto/update-billing-item.dto';
import { GetBillDropdownDto } from './dto/get-bill-dropdown.dto';
import { User } from 'src/users/schemas/user.schema';
import {
  COUNTER_KEYS,
  CountersService,
} from 'src/counters/counters.service';

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    @InjectModel(BillingItem.name) private billingItemModel: Model<BillingItem>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly usersService: UsersService,
    private readonly countersService: CountersService,
  ) {
    // Discover pharmacy/lab invoice prefixes and seed each missing counter once.
    this.countersService.registerBootSeedJob(() => this.seedInvoiceCounters());
  }

  private roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private normalizeItems(items?: CreateBillingItemDto[]): CreateBillingItemDto[] {
    if (!items?.length) throw new BadRequestException('A bill requires at least one item.');
    return items.map((item, index) => {
      const quantity = item.quantity ?? 1;
      const unitPrice = item.unitPrice ?? 0;
      const discount = item.discount ?? 0;
      if (!item.name?.trim() || !Number.isFinite(quantity) || quantity <= 0 ||
          !Number.isFinite(unitPrice) || unitPrice < 0 ||
          !Number.isFinite(discount) || discount < 0) {
        throw new BadRequestException(`Item ${index + 1} has an invalid name, quantity, price or discount.`);
      }
      const base = this.roundMoney(quantity * unitPrice);
      const roundedDiscount = this.roundMoney(discount);
      if (roundedDiscount > base) {
        throw new BadRequestException(`Item ${index + 1} discount exceeds its price.`);
      }
      const total = this.roundMoney(base - roundedDiscount);
      if (item.total != null && (!Number.isFinite(item.total) || Math.abs(item.total - total) > 0.01)) {
        throw new BadRequestException(`Item ${index + 1} total does not match its price and discount.`);
      }
      return { ...item, name: item.name.trim(), quantity, unitPrice, discount: roundedDiscount, total };
    });
  }

  private validatePaymentTotals(
    items: Pick<CreateBillingItemDto, 'total'>[],
    payment: { cash?: number; online?: number; card?: number; refund?: number; discount?: number },
  ) {
    const subtotal = this.roundMoney(items.reduce((sum, item) => sum + (item.total ?? 0), 0));
    const submitted = {
      cash: payment.cash ?? 0,
      online: payment.online ?? 0,
      card: payment.card ?? 0,
      refund: payment.refund ?? 0,
      discount: payment.discount ?? 0,
    };
    for (const [name, amount] of Object.entries(submitted)) {
      if (!Number.isFinite(amount) || amount < 0) {
        throw new BadRequestException(`${name} must be a non-negative amount.`);
      }
    }
    const { cash, online, card, refund, discount } = Object.fromEntries(
      Object.entries(submitted).map(([name, amount]) => [name, this.roundMoney(amount)]),
    ) as typeof submitted;
    if (discount > subtotal) throw new BadRequestException('Discount exceeds the bill total.');
    const grossPaid = this.roundMoney(cash + online + card);
    if (refund > grossPaid) throw new BadRequestException('Refund exceeds the amount collected.');
    if (this.roundMoney(grossPaid - refund) > this.roundMoney(subtotal - discount)) {
      throw new BadRequestException('Payment exceeds the bill total after discount.');
    }
    return { cash, online, card, refund, discount, subtotal };
  }

  private initialPaymentEvent(payment: { cash: number; online: number; card: number; refund: number }, at: Date) {
    return {
      at,
      cashDelta: payment.cash,
      onlineDelta: payment.online,
      cardDelta: payment.card,
      refundDelta: payment.refund,
    };
  }

  private async syncLinkedOrderPayment(bill: Billing, session?: mongoose.ClientSession) {
    if (bill.transactionType === 'Return') return;
    const total = this.roundMoney((bill.items || []).reduce((sum, item) => sum + (item.total || 0), 0));
    const payable = this.roundMoney(total - (bill.discount || 0));
    const paid = this.roundMoney((bill.cash || 0) + (bill.online || 0) +
      (bill.card || 0) - (bill.refund || 0));
    const grossPaid = this.roundMoney((bill.cash || 0) + (bill.online || 0) + (bill.card || 0));
    const paymentStatus = grossPaid <= 0 ? PaymentStatus.Pending :
      grossPaid >= payable ? PaymentStatus.Paid : PaymentStatus.Partial;
    await this.orderModel.findOneAndUpdate(
      { billNo: bill.mrn },
      { $set: { paidAmount: paid, paymentStatus } },
      { session },
    );
  }

  /** Leading letter prefix from bill MRNs like INV0042 → INV. */
  private normalizeInvoicePrefix(prefix: string): string {
    return String(prefix || 'INV').trim().toUpperCase() || 'INV';
  }

  private async maxInvoiceSeq(prefix: string): Promise<number> {
    const safePrefix = this.normalizeInvoicePrefix(prefix);
    const lastRecord = await this.billingModel
      .findOne({ mrn: { $regex: `^${safePrefix}\\d+$` } })
      .collation({ locale: 'en_US', numericOrdering: true })
      .sort({ mrn: -1 })
      .select('mrn')
      .lean()
      .exec();

    if (lastRecord?.mrn) {
      const match = String(lastRecord.mrn).match(
        new RegExp(`^${safePrefix}(\\d+)$`),
      );
      if (match?.[1]) return parseInt(match[1], 10);
    }
    return 0;
  }

  /**
   * Collect invoice prefixes from configured pharmacy/lab billing settings and
   * existing bill MRNs. Always includes INV. Never invents unsafe keys.
   */
  private async discoverInvoicePrefixes(): Promise<string[]> {
    const prefixes = new Set<string>(['INV']);

    const users = await this.userModel
      .find({})
      .select('pharmacy.billing.prefix lab.billing.prefix')
      .lean()
      .exec();
    for (const u of users) {
      const pharmacyPrefix = (u as any)?.pharmacy?.billing?.prefix;
      const labPrefix = (u as any)?.lab?.billing?.prefix;
      if (pharmacyPrefix) {
        prefixes.add(this.normalizeInvoicePrefix(pharmacyPrefix));
      }
      if (labPrefix) {
        prefixes.add(this.normalizeInvoicePrefix(labPrefix));
      }
    }

    const mrns = await this.billingModel
      .distinct('mrn', { mrn: { $regex: /^[A-Za-z]+\d+$/ } })
      .exec();
    for (const mrn of mrns) {
      const match = String(mrn).match(/^([A-Za-z]+)\d+$/);
      if (match?.[1]) {
        prefixes.add(this.normalizeInvoicePrefix(match[1]));
      }
    }

    return [...prefixes];
  }

  /** First-time seed for each discovered invoice:<PREFIX> counter. */
  async seedInvoiceCounters(): Promise<void> {
    const prefixes = await this.discoverInvoicePrefixes();
    for (const prefix of prefixes) {
      await this.countersService.seedIfMissing(
        COUNTER_KEYS.invoice(prefix),
        () => this.maxInvoiceSeq(prefix),
      );
    }
  }

  private async generateUniqueMRN(prefix: string): Promise<string> {
    const safePrefix = this.normalizeInvoicePrefix(prefix);
    return this.countersService.nextFormatted(COUNTER_KEYS.invoice(safePrefix), {
      prefix: safePrefix,
      pad: 4,
      getInitialMax: () => this.maxInvoiceSeq(safePrefix),
    });
  }

  async generateBill(createBill: CreateBillingDto, session?: mongoose.ClientSession) {
    if (createBill.clientRequestId) {
      const previous = await this.billingModel.findOne({
        user: createBill.user,
        clientRequestId: createBill.clientRequestId,
      }).session(session || null);
      if (previous) return previous;
    }
    if (!mongoose.isValidObjectId(createBill.patient)) {
      throw new BadRequestException('A valid patient is required.');
    }
    const patient = await this.billingModel.db.collection('patients').findOne(
      { _id: new mongoose.Types.ObjectId(String(createBill.patient)) },
      session ? { session } : undefined,
    );
    if (!patient) throw new BadRequestException('Patient was not found.');
    const items = this.normalizeItems(createBill.items);
    const payment = this.validatePaymentTotals(items, createBill);
    const preparedBill = {
      ...createBill,
      items,
      cash: payment.cash,
      online: payment.online,
      card: payment.card,
      refund: payment.refund,
      discount: payment.discount,
      paymentEvents: [this.initialPaymentEvent(payment, new Date())],
    };
    const prefix = await this.usersService.getPharmacyBillingPrefix(
      createBill.user,
    );
    preparedBill.mrn = await this.generateUniqueMRN(prefix);
    try {
      if (session) return (await this.billingModel.create([preparedBill], { session }))[0];
      if (!createBill.rxId) return await this.billingModel.create(preparedBill);

      const localSession = await this.billingModel.db.startSession();
      try {
        let created: Billing | undefined;
        await localSession.withTransaction(async () => {
          const order = await this.orderModel.findOneAndUpdate(
            {
              mrn: createBill.rxId,
              $or: [{ billNo: '-' }, { billNo: null }, { billNo: { $exists: false } }],
            },
            { $set: { billNo: preparedBill.mrn } },
            { new: true, session: localSession },
          );
          if (!order) throw new BadRequestException('Order not found or already billed.');
          if (String(order.patient) !== String(createBill.patient)) {
            throw new BadRequestException('The bill patient does not match the order.');
          }
          created = (await this.billingModel.create([preparedBill], { session: localSession }))[0];
          await this.syncLinkedOrderPayment(created, localSession);
        });
        return created!;
      } finally {
        await localSession.endSession();
      }
    } catch (error: any) {
      if (error?.code === 11000 && createBill.clientRequestId) {
        const previous = await this.billingModel.findOne({
          user: createBill.user,
          clientRequestId: createBill.clientRequestId,
        });
        if (previous) return previous;
      }
      throw error;
    }
  }

  private async buildBillFilterPipeline(
    user: mongoose.Types.ObjectId,
    getBillisDto: GetBillisDto,
  ): Promise<any[]> {
    const { q, qEnd, method, status, startDate, endDate, billingType, doctor } = getBillisDto;
    const pipeline: any[] = [];

    const match: any = { user: new mongoose.Types.ObjectId(user) };

    // Legacy invoice-range: From/To MRN when both q and qEnd are set and qEnd exists
    const qEndFound =
      qEnd &&
      (await this.billingModel.exists({
        mrn: qEnd?.toUpperCase(),
      }));

    if (q && qEnd && qEndFound) {
      match.mrn = { $gte: q.toUpperCase(), $lte: qEnd.toUpperCase() };
    } else if (q?.trim()) {
      // Single search: invoice (bill mrn / salesMRN), patient PID, name, phone
      const escaped = q
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      const patientDocs = await this.billingModel.db
        .collection('patients')
        .find({
          $or: [
            { name: searchRegex },
            { phoneNumber: searchRegex },
            { mrn: searchRegex },
          ],
        })
        .project({ _id: 1 })
        .toArray();
      const patientIds = patientDocs.map((p) => p._id);
      match.$or = [
        { mrn: searchRegex },
        { salesMRN: searchRegex },
        ...(patientIds.length
          ? [{ patient: { $in: patientIds } }]
          : []),
      ];
    }

    // Date filter always applies alongside search (and when no search)
    if (startDate && endDate) {
      match.createdAt = { $gte: startDate, $lte: endDate };
    }

    if (method) {
      if (method === 'Cash') {
        match.cash = { $ne: 0 };
      } else if (method === 'Online') {
        match.online = { $ne: 0 };
      }
    }

    if (billingType === 'Sale') {
      match.transactionType = { $ne: 'Return' };
    } else if (billingType === 'Return') {
      match.transactionType = 'Return';
    } else if (billingType === 'Lab') {
      match.reportId = { $exists: true, $ne: null };
    }

    pipeline.push({ $match: match });

    // Add calculations for status filtering
    pipeline.push({
      $addFields: {
        itemsTotal: {
          $round: [
            {
              $subtract: [
                { $sum: '$items.total' },
                { $ifNull: ['$discount', 0] },
              ],
            },
            2,
          ],
        },
        totalPaid: {
          $round: [
            {
              $subtract: [
                {
                  $add: [
                    { $ifNull: ['$cash', 0] },
                    { $ifNull: ['$online', 0] },
                    { $ifNull: ['$card', 0] },
                  ],
                },
                { $ifNull: ['$refund', 0] },
              ],
            },
            2,
          ],
        },
      },
    });

    if (status) {
      if (status === 'Unpaid') {
        pipeline.push({
          $match: {
            totalPaid: { $lte: 0 },
            transactionType: { $ne: 'Return' },
            $expr: { $gt: ['$itemsTotal', '$totalPaid'] },
          },
        });
      } else if (status === 'Paid') {
        pipeline.push({
          $match: {
            transactionType: { $ne: 'Return' },
            $expr: {
              $lte: ['$itemsTotal', '$totalPaid'],
            },
          },
        });
      } else if (status === 'Partial') {
        pipeline.push({
          $match: {
            transactionType: { $ne: 'Return' },
            $and: [
              {
                $expr: {
                  $gt: ['$itemsTotal', '$totalPaid'],
                },
              },
              { totalPaid: { $gt: 0 } },
            ],
          },
        });
      }
    }

    // Soft billing-type line heuristics (include-if-any). Catalogue names from billing_items.
    if (
      billingType &&
      ['Consultation', 'Clinical', 'Pharmacy', 'Dressing'].includes(billingType)
    ) {
      const catalogue = await this.billingItemModel.find({ user }).select('item').lean();
      const catalogueNames = catalogue.map((c) => c.item).filter(Boolean);
      const clinicalKeywords = [
        'procedure',
        'injection',
        'cannulation',
        'extraction',
        'catheterisation',
        'enema',
        'dressing',
      ];

      if (billingType === 'Consultation') {
        pipeline.push({
          $match: {
            items: {
              $elemMatch: { name: { $regex: /consultation|(^|[^a-z])cf([^a-z]|$)/i } },
            },
          },
        });
      } else if (billingType === 'Dressing') {
        pipeline.push({
          $match: {
            items: {
              $elemMatch: { name: { $regex: /dressing/i } },
            },
          },
        });
      } else if (billingType === 'Clinical') {
        pipeline.push({
          $match: {
            $or: [
              {
                'items.name': {
                  $regex: new RegExp(clinicalKeywords.join('|'), 'i'),
                },
              },
              ...(catalogueNames.length
                ? [
                    {
                      $and: [
                        { 'items.name': { $in: catalogueNames } },
                        {
                          'items.name': {
                            $not: { $regex: /consultation/i },
                          },
                        },
                      ],
                    },
                  ]
                : []),
            ],
          },
        });
      } else if (billingType === 'Pharmacy') {
        // Include-if-any line that is not consultation and not in clinical catalogue
        pipeline.push({
          $match: {
            items: {
              $elemMatch: {
                name: {
                  $nin: catalogueNames,
                  $not: { $regex: /consultation/i },
                },
              },
            },
          },
        });
      }
    }

    if (doctor?.length) {
      const doctorUsers = await this.userModel
        .find({ name: { $in: doctor } })
        .select('_id')
        .lean();
      pipeline.push({
        $match: {
          doctor: {
            $in: [...doctor, ...doctorUsers.map((entry) => String(entry._id))],
          },
        },
      });
    }
    return pipeline;
  }

  async getBills(user: mongoose.Types.ObjectId, getBillisDto: GetBillisDto) {
    const { page = 1, limit = 10, activeDate } = getBillisDto;
    const skip = (page - 1) * limit;
    const pipeline = await this.buildBillFilterPipeline(user, getBillisDto);

    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $sort: { createdAt: -1 } },
          ...(activeDate === 'Today' || activeDate === 'Custom' || true
            ? []
            : [{ $skip: skip }, { $limit: limit }]),
          {
            $lookup: {
              from: 'patients',
              localField: 'patient',
              foreignField: '_id',
              as: 'patient',
            },
          },
          { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'users',
              localField: 'patient.doctor',
              foreignField: '_id',
              as: 'patient.doctor',
            },
          },
          {
            $unwind: {
              path: '$patient.doctor',
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
      },
    });

    const result = await this.billingModel.aggregate(pipeline).exec();

    const data = result[0].data;
    const total = result[0].metadata[0]?.total ?? 0;

    // Populate doctor names for the bills
    for (const bill of data) {
      if (bill.doctor && mongoose.isValidObjectId(bill.doctor)) {
        const doc = await this.usersService.getUserById(bill.doctor);
        if (doc) {
          bill.doctor = doc;
        }
      }
    }

    return { data, total };
  }

  async getBillsSummary(user: mongoose.Types.ObjectId, filters: GetBillisDto) {
    const pipeline = await this.buildBillFilterPipeline(user, filters);
    const catalogue = await this.billingItemModel
      .find({ user: new mongoose.Types.ObjectId(user) })
      .select('item')
      .lean();
    const catalogueNames = catalogue
      .map((entry) => String(entry.item || '').trim().toLowerCase())
      .filter(Boolean);
    const name = { $toLower: { $trim: { input: { $ifNull: ['$items.name', ''] } } } };
    const isConsultation = {
      $regexMatch: { input: name, regex: 'consultation|(^|[^a-z])cf([^a-z]|$)' },
    };
    const isProcedure = {
      $or: [
        { $in: [name, catalogueNames] },
        { $regexMatch: { input: name, regex: 'procedure|injection|cannulation|extraction|catheterisation|enema|dressing' } },
      ],
    };
    const paid = {
      $subtract: [
        {
          $add: [
            { $ifNull: ['$cash', 0] },
            { $ifNull: ['$online', 0] },
            { $ifNull: ['$card', 0] },
          ],
        },
        { $ifNull: ['$refund', 0] },
      ],
    };

    pipeline.push(
      { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          summarySign: { $cond: [{ $eq: ['$transactionType', 'Return'] }, -1, 1] },
          summaryLineTotal: {
            $ifNull: [
              '$items.total',
              { $multiply: [{ $ifNull: ['$items.unitPrice', 0] }, { $ifNull: ['$items.quantity', 0] }] },
            ],
          },
          summaryCategory: {
            $switch: {
              branches: [
                { case: { $ne: [{ $ifNull: ['$reportId', null] }, null] }, then: 'other' },
                { case: isConsultation, then: 'consultationFee' },
                { case: { $ne: [{ $ifNull: ['$items.itemId', null] }, null] }, then: 'medicineSold' },
                { case: isProcedure, then: 'procedureCharge' },
              ],
              default: 'medicineSold',
            },
          },
        },
      },
      {
        $group: {
          _id: '$_id',
          total: { $sum: { $multiply: ['$summaryLineTotal', '$summarySign'] } },
          paid: { $first: { $multiply: [paid, '$summarySign'] } },
          consultationFee: {
            $sum: { $cond: [{ $eq: ['$summaryCategory', 'consultationFee'] }, { $multiply: ['$summaryLineTotal', '$summarySign'] }, 0] },
          },
          medicineSold: {
            $sum: { $cond: [{ $eq: ['$summaryCategory', 'medicineSold'] }, { $multiply: ['$summaryLineTotal', '$summarySign'] }, 0] },
          },
          procedureCharge: {
            $sum: { $cond: [{ $eq: ['$summaryCategory', 'procedureCharge'] }, { $multiply: ['$summaryLineTotal', '$summarySign'] }, 0] },
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$total' },
          paid: { $sum: '$paid' },
          consultationFee: { $sum: '$consultationFee' },
          medicineSold: { $sum: '$medicineSold' },
          procedureCharge: { $sum: '$procedureCharge' },
        },
      },
      {
        $project: {
          _id: 0,
          total: { $round: ['$total', 2] },
          paid: { $round: ['$paid', 2] },
          consultationFee: { $round: ['$consultationFee', 2] },
          medicineSold: { $round: ['$medicineSold', 2] },
          procedureCharge: { $round: ['$procedureCharge', 2] },
        },
      },
    );

    const [summary] = await this.billingModel.aggregate(pipeline).exec();
    return summary ?? {
      total: 0,
      paid: 0,
      consultationFee: 0,
      medicineSold: 0,
      procedureCharge: 0,
    };
  }

  async getBill(id: mongoose.Types.ObjectId, user: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id))
      throw new BadRequestException('Please provide a valid bill id');
    const data = await this.billingModel
      .findOne({ _id: id, user })
      .populate('patient')
      .populate('items')
      .lean()
      .exec();
    if (!data) throw new NotFoundException('Bill is not found.');

    if (data.doctor && mongoose.isValidObjectId(data.doctor)) {
      const doc = await this.usersService.getUserById(data.doctor);
      if (doc) {
        (data as any).doctor = doc;
      }
    }
    return data;
  }

  async getBillByReportId(reportId: mongoose.Types.ObjectId, user: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(reportId))
      throw new BadRequestException('Please provide a valid report id');
    const data = await this.billingModel
      .findOne({ reportId, user })
      .populate('patient')
      .populate('items')
      .lean()
      .exec();
    if (!data) throw new NotFoundException('Bill is not found.');

    if (data.doctor && mongoose.isValidObjectId(data.doctor)) {
      const doc = await this.usersService.getUserById(data.doctor);
      if (doc) {
        (data as any).doctor = doc;
      }
    }
    return data;
  }


  async updateBill(id: mongoose.Types.ObjectId, updateBillDto: UpdateBillingDto, user?: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id))
      throw new BadRequestException('Please provide a valid bill id');
    
    const filter = { _id: id, ...(user ? { user } : {}) };
    const existingBill = await this.billingModel.findOne(filter);
    if (!existingBill) throw new NotFoundException('Bill is not found.');
    
    if (existingBill.status === 'Completed') {
      throw new BadRequestException('Cannot edit a completed bill');
    }

    const { user: _ignoredUser, ...updates } = updateBillDto;
    const data = await this.billingModel.findOneAndUpdate(
      { ...filter, status: { $ne: 'Completed' } },
      { $set: updates },
      { new: true, runValidators: true }
    );
    return data;
  }

  async getPharmacyBillForEdit(id: mongoose.Types.ObjectId, user: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id)) throw new BadRequestException('Invalid bill ID.');
    const bill = await this.billingModel.findOne({
      _id: id, user, transactionType: 'Sale', reportId: null,
    }).populate('patient').lean().exec();
    if (!bill) throw new NotFoundException('Pharmacy bill not found.');
    if (bill.status === 'Completed') throw new BadRequestException('Completed bills cannot be edited.');
    const linkedOrder = await this.orderModel.exists({ billNo: bill.mrn });
    return { bill, linkedOrder: !!linkedOrder };
  }

  async editPharmacyBill(
    id: mongoose.Types.ObjectId,
    dto: EditPharmacyBillDto,
    user: mongoose.Types.ObjectId,
  ) {
    if (!mongoose.isValidObjectId(id)) throw new BadRequestException('Invalid bill ID.');
    const items = this.normalizeItems(dto.items);
    const session = await this.billingModel.db.startSession();
    try {
      let updated: Billing | null = null;
      await session.withTransaction(async () => {
        const existing = await this.billingModel.findOne({
          _id: id, user, transactionType: 'Sale', reportId: null,
        }).session(session).exec();
        if (!existing) throw new NotFoundException('Pharmacy bill not found.');
        if (existing.status === 'Completed') throw new BadRequestException('Completed bills cannot be edited.');
        const expectedUpdatedAt = new Date(dto.expectedUpdatedAt);
        if (existing.get('updatedAt')?.getTime() !== expectedUpdatedAt.getTime()) {
          throw new ConflictException('Bill changed while editing. Refresh and retry.');
        }

        const linkedOrder = await this.orderModel.findOne({ billNo: existing.mrn }).session(session).exec();
        const savedMedicines = existing.items.filter(item => !!item.itemId);
        if (linkedOrder) {
          const editedMedicines = items.filter(item => !!item.itemId);
          const medicineChanged = savedMedicines.length !== editedMedicines.length ||
            savedMedicines.some((saved, index) => {
              const edited = editedMedicines[index];
              return !edited || String(saved.itemId) !== String(edited.itemId) ||
                saved.name !== edited.name || saved.quantity !== edited.quantity ||
                saved.unitPrice !== edited.unitPrice || saved.discount !== edited.discount ||
                saved.total !== edited.total || saved.batchId !== (edited.batchId ?? null) ||
                saved.batchNumber !== (edited.batchNumber ?? null);
            });
          if (medicineChanged) {
            throw new BadRequestException('Edit medicines on the linked order, not on its bill.');
          }
        }

        // Keep the original inventory snapshot; this form only edits bill lines.
        let medicineIndex = 0;
        const billItems = linkedOrder
          ? items.map(item => item.itemId ? savedMedicines[medicineIndex++] : item)
          : items;

        const payment = this.validatePaymentTotals(billItems, {
          cash: existing.cash,
          online: existing.online,
          card: existing.card,
          refund: existing.refund,
          discount: dto.discount,
        });
        updated = await this.billingModel.findOneAndUpdate(
          { _id: id, user, transactionType: 'Sale', reportId: null, status: { $ne: 'Completed' }, updatedAt: expectedUpdatedAt },
          { $set: {
            items: billItems,
            discount: payment.discount,
            doctor: dto.doctor?.trim() || 'Self',
            note: dto.note ?? existing.note ?? '',
          } },
          { new: true, runValidators: true, session },
        );
        if (!updated) throw new ConflictException('Bill changed while editing. Refresh and retry.');
        if (linkedOrder) {
          await this.orderModel.findOneAndUpdate(
            { _id: linkedOrder._id },
            { $set: { discount: payment.discount, doctorName: dto.doctor?.trim() || 'Self' } },
            { session },
          );
          await this.syncLinkedOrderPayment(updated, session);
        }
      });
      return updated!;
    } finally {
      await session.endSession();
    }
  }

  async updateBillStatusByReportId(reportId: mongoose.Types.ObjectId, status: 'Draft' | 'Completed') {
    if (!mongoose.isValidObjectId(reportId))
      throw new BadRequestException('Please provide a valid report id');
    
    const data = await this.billingModel.findOneAndUpdate(
      { reportId },
      { $set: { status } },
      { new: true }
    );
    return data;
  }

  async addBillingItem(
    addBillingItemDto: AddBillingItemDto,
    user: mongoose.Types.ObjectId,
  ) {
    const isExist = await this.billingItemModel.exists({
      user,
      code: addBillingItemDto.code,
    });

    if (isExist) {
      throw new BadRequestException(
        'Item code already exists in billing items.',
      );
    }
    const data = await this.billingItemModel.create({
      user,
      ...addBillingItemDto,
    });
    return data;
  }

  async updateBillingItem(
    id: mongoose.Types.ObjectId,
    updateBillingItemDto: UpdateBillingItemDto,
    user: mongoose.Types.ObjectId,
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Invalid billing item ID');
    }

    if (updateBillingItemDto.code) {
      const isExist = await this.billingItemModel.exists({
        user,
        code: updateBillingItemDto.code,
        _id: { $ne: id },
      });

      if (isExist) {
        throw new BadRequestException('Item code already exists in billing.');
      }
    }

    const data = await this.billingItemModel.findOneAndUpdate(
      { _id: id, user },
      updateBillingItemDto,
      { new: true },
    );

    if (!data) {
      throw new NotFoundException('Billing item not found');
    }

    return data;
  }

  async getBillingItems(
    { item }: GetBillingItemDto,
    user: mongoose.Types.ObjectId,
  ) {
    const filter: any = { user };

    if (item) {
      filter.$or = [
        { item: new RegExp(`^${item}`, 'i') },
        { code: new RegExp(`^${item}`, 'i') },
      ];
    }

    return this.billingItemModel.find(filter).lean().exec();
  }

  async deleteBillingItem(item: string, user: mongoose.Types.ObjectId) {
    const data = await this.billingItemModel.findOneAndDelete({ user, item });
    return data;
  }

  async addPayment(
    id: mongoose.Types.ObjectId,
    addPaymentDto: AddPaymentDto,
    user: mongoose.Types.ObjectId,
  ) {
    if (!mongoose.isValidObjectId(id)) throw new BadRequestException('Invalid bill ID.');
    const session = await this.billingModel.db.startSession();
    try {
      let updated: Billing | null = null;
      await session.withTransaction(async () => {
        const bill = await this.billingModel.findOne({ _id: id, user }).session(session);
        if (!bill) throw new NotFoundException('Bill is not found.');
        if (bill.transactionType === 'Return') {
          throw new BadRequestException('Return bills cannot receive payments.');
        }
        const payment = this.validatePaymentTotals(bill.items, {
          ...addPaymentDto,
          card: addPaymentDto.card ?? bill.card,
          refund: addPaymentDto.refund ?? bill.refund,
          discount: addPaymentDto.discount ?? bill.discount,
        });
        const old = {
          cash: bill.cash || 0,
          online: bill.online || 0,
          card: bill.card || 0,
          refund: bill.refund || 0,
        };
        const delta = this.initialPaymentEvent({
          cash: this.roundMoney(payment.cash - old.cash),
          online: this.roundMoney(payment.online - old.online),
          card: this.roundMoney(payment.card - old.card),
          refund: this.roundMoney(payment.refund - old.refund),
        }, new Date());
        const oldEvents = bill.paymentEvents?.length ? [] : [
          this.initialPaymentEvent(old, (bill as any).createdAt || new Date()),
        ];
        updated = await this.billingModel.findOneAndUpdate(
          { _id: id, user, updatedAt: (bill as any).updatedAt },
          {
            $set: {
              cash: payment.cash,
              online: payment.online,
              card: payment.card,
              discount: payment.discount,
              refund: payment.refund,
              expense: addPaymentDto.expense ?? bill.expense ?? 0,
              remarks: addPaymentDto.remarks?.trim() ?? bill.remarks ?? '',
            },
            $push: { paymentEvents: { $each: [...oldEvents, delta] } },
          },
          { new: true, session },
        );
        if (!updated) throw new ConflictException('Bill changed. Refresh and retry the payment.');
        await this.syncLinkedOrderPayment(updated, session);
      });
      return updated;
    } finally {
      await session.endSession();
    }
  }

  async markAsPaid(id: mongoose.Types.ObjectId, user: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('A valid bill is required.');
    }
    const session = await this.billingModel.db.startSession();
    try {
      let data: Billing | null = null;
      await session.withTransaction(async () => {
        const bill = await this.billingModel.findOne({ _id: id, user }).session(session);
        if (!bill) throw new NotFoundException('Bill is not found.');
        if (bill.transactionType === 'Return') {
          throw new BadRequestException('Return bills cannot be marked as paid.');
        }

        const total = (bill.items || []).reduce(
          (sum, item) => sum + (item.total || 0),
          0,
        );
        const paid =
          (bill.cash || 0) + (bill.online || 0) + (bill.card || 0);
        const balance = Math.max(
          0,
          Number((total - (bill.discount || 0) - paid).toFixed(2)),
        );
        if (balance <= 0) {
          throw new BadRequestException(
            'This bill has no remaining balance. Refresh the billing list.',
          );
        }

        const old = {
          cash: bill.cash || 0,
          online: bill.online || 0,
          card: bill.card || 0,
          refund: bill.refund || 0,
        };
        const oldEvents = bill.paymentEvents?.length ? [] : [
          this.initialPaymentEvent(old, (bill as any).createdAt || new Date()),
        ];
        data = await this.billingModel.findOneAndUpdate(
          { _id: id, user, updatedAt: (bill as any).updatedAt },
          {
            $set: {
              cash: Number(((bill.cash || 0) + balance).toFixed(2)),
            },
            $push: {
              paymentEvents: {
                $each: [
                  ...oldEvents,
                  {
                    at: new Date(),
                    cashDelta: balance,
                    onlineDelta: 0,
                    cardDelta: 0,
                    refundDelta: 0,
                  },
                ],
              },
            },
          },
          { new: true, session },
        );
        if (!data) throw new ConflictException('Bill changed. Refresh and retry the payment.');
        await this.syncLinkedOrderPayment(data, session);
      });
      return data;
    } finally {
      await session.endSession();
    }
  }

  async getBillDropDown(getBillDropDownDto: GetBillDropdownDto, user: mongoose.Types.ObjectId) {
    const { query = '', } = getBillDropDownDto;

    const data = await this.billingModel.find({ user, mrn: new RegExp(query, 'i'), transactionType: "Sale" })
      .limit(10).select("user patient mrn")
      .populate("patient", "name phoneNumber gender dateOfBirth mrn address")
      .lean()
      .exec();
    return data;
  }

  async getSingleCustomerBill(q: string, user: mongoose.Types.ObjectId) {
    const data = await this.billingModel.find({ user, patient: q })
      .populate("patient", "name phoneNumber gender dateOfBirth mrn address")
      .lean()
      .exec();
    return data;
  }

}
