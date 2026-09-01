import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBillingDto } from './dto/create-billing.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Billing } from './schemas/billing.schema';
import mongoose, { Model } from 'mongoose';
import { GetBillisDto } from './dto/get-bills.dto';
import { AddBillingItemDto } from './dto/add-billing-item.dto';
import { BillingItem } from './schemas/billingItem.schema';
import { GetBillingItemDto } from './dto/get-billing-item.dto';
import { UsersService } from 'src/users/users.service';
import { AddPaymentDto } from './dto/add-payment.dto';
import { MarkAsPaidDto } from './dto/mark-as-paind.dto';
import { Order, PaymentStatus } from 'src/pharmacy/orders/schemas/order.schema';
import { UpdateBillingItemDto } from './dto/update-billing-item.dto';
import { GetBillDropdownDto } from './dto/get-bill-dropdown.dto';

import { AccountsService } from 'src/accounts/accounts.service';
import {
  ExpenseCategory,
  IncomeCategory,
  PaymentMethod,
  SourceModule,
  TransactionType,
} from 'src/accounts/enums/account-transaction.enum';

import configuration from 'src/config/configuration';

@Injectable()
export class BillingService {
  constructor(
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    @InjectModel(BillingItem.name) private billingItemModel: Model<BillingItem>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    private readonly usersService: UsersService,
    private readonly accountsService: AccountsService,
  ) {}

  private async determineSourceModule(userId: any): Promise<SourceModule> {
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return SourceModule.Pharmacy;
    }

    const uIdStr = userId.toString();
    const config = configuration();
    if (
      config.in_house_lab_id &&
      uIdStr === config.in_house_lab_id.toString()
    ) {
      return SourceModule.Lab;
    }
    if (
      config.in_house_pharmacy_id &&
      uIdStr === config.in_house_pharmacy_id.toString()
    ) {
      return SourceModule.Pharmacy;
    }
    if (
      config.in_house_reception_id &&
      uIdStr === config.in_house_reception_id.toString()
    ) {
      return SourceModule.Reception;
    }

    try {
      const user = await this.usersService.getUserById(userId);
      if (!user || !user.role) {
        return SourceModule.Pharmacy;
      }

      const role = String(user.role).toLowerCase();
      if (role.includes('doctor')) return SourceModule.Doctor;
      if (role.includes('pharmacy') || role.includes('pharmacist'))
        return SourceModule.Pharmacy;
      if (role.includes('lab') || role.includes('technician'))
        return SourceModule.Lab;
      if (role.includes('reception') || role.includes('receptionist'))
        return SourceModule.Reception;

      return SourceModule.Pharmacy;
    } catch {
      return SourceModule.Pharmacy;
    }
  }

  private async generateUniqueMRN(prefix: string): Promise<string> {
    const prefixWithHyphen = prefix.endsWith('-') ? prefix : `${prefix}-`;
    const lastRecord = await this.billingModel
      .findOne({ mrn: { $regex: `^${prefixWithHyphen}\\d+$` } })
      .collation({ locale: 'en_US', numericOrdering: true })
      .sort({ mrn: -1 })
      .select('mrn')
      .lean()
      .exec();

    let nextNumber = 1;
    if (lastRecord && lastRecord.mrn) {
      const match = lastRecord.mrn.match(
        new RegExp(`^${prefixWithHyphen}(\\d+)$`),
      );
      if (match && match[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    let mrn: string;
    let exists = true;
    do {
      mrn = `${prefixWithHyphen}${nextNumber.toString().padStart(5, '0')}`;
      const existing = await this.billingModel.exists({ mrn });
      exists = !!existing;
      if (exists) nextNumber++;
    } while (exists);

    return mrn;
  }

  async generateBill(createBill: CreateBillingDto) {
    const prefix = await this.usersService.getPharmacyBillingPrefix(
      createBill.user,
    );
    createBill.mrn = await this.generateUniqueMRN(prefix);

    const itemsTotal = (createBill.items ?? []).reduce(
      (sum, item) =>
        sum + (item.total ?? (item.quantity ?? 1) * (item.unitPrice ?? 0)),
      0,
    );
    const totalPaid =
      (createBill.cash ?? 0) +
      (createBill.card ?? 0) +
      (createBill.upi ?? 0) +
      (createBill.discount ?? 0);

    if (!createBill.status) {
      createBill.status = totalPaid >= itemsTotal ? 'Completed' : 'Draft';
    }

    const data = await this.billingModel.create(createBill);
    if (createBill.rxId) {
      const order: any = await this.orderModel
        .findOne({ mrn: createBill.rxId })
        .populate('items.name');
      if (order) {
        order.billNo = data.mrn;
        const paidAmount =
          (createBill.cash ?? 0) +
          (createBill.card ?? 0) +
          (createBill.upi ?? 0) +
          (createBill.discount ?? 0);
        order.paidAmount =
          paidAmount >=
          order.items.reduce(
            (total, item) => total + item.quantity * item.name.unitPrice,
            0,
          )
            ? order.items.reduce(
                (total, item) => total + item.quantity * item.name.unitPrice,
                0,
              )
            : paidAmount;
        if (paidAmount === 0) {
          order.paymentStatus = PaymentStatus.Pending;
        } else if (
          paidAmount <
          order.items.reduce(
            (total, item) => total + item.quantity * item.name.unitPrice,
            0,
          )
        ) {
          order.paymentStatus = PaymentStatus.Partial;
        } else if (
          paidAmount >=
          order.items.reduce(
            (total, item) => total + item.quantity * item.name.unitPrice,
            0,
          )
        ) {
          order.paymentStatus = PaymentStatus.Paid;
        }
        await order.save();
      }
    }

    // Auto-record transaction in Accounts
    try {
      const sourceModule = await this.determineSourceModule(createBill.user);
      const isRefund =
        createBill.transactionType === 'Refund' ||
        (createBill.items &&
          createBill.items.some((i: any) =>
            String(i.name || '')
              .toLowerCase()
              .includes('refund'),
          ));
      const isReturn = createBill.transactionType === 'Return';
      const isExpense = isRefund || isReturn;

      const type = isExpense ? TransactionType.Expense : TransactionType.Income;
      let category: string;
      if (isRefund) {
        category = ExpenseCategory.Refund;
      } else if (isReturn) {
        category = ExpenseCategory.SalesReturn;
      } else {
        const isTherapy =
          String(createBill.note || '')
            .toLowerCase()
            .includes('therapy') ||
          (createBill.items &&
            createBill.items.some((i: any) =>
              String(i.name || '')
                .toLowerCase()
                .includes('therapy'),
            ));

        const isProcedure =
          String(createBill.note || '')
            .toLowerCase()
            .includes('procedure') ||
          (createBill.items &&
            createBill.items.some((i: any) =>
              String(i.name || '')
                .toLowerCase()
                .includes('procedure'),
            ));

        if (isTherapy) category = IncomeCategory.TherapyIncome;
        else if (isProcedure) category = IncomeCategory.ProcedureIncome;
        else if (sourceModule === SourceModule.Doctor)
          category = IncomeCategory.ConsultationFee;
        else if (sourceModule === SourceModule.Lab)
          category = IncomeCategory.LaboratoryIncome;
        else if (sourceModule === SourceModule.Reception)
          category = IncomeCategory.ConsultationFee;
        else category = IncomeCategory.MedicineSale;
      }

      let paymentMethod = PaymentMethod.Cash;
      if (
        (createBill.card ?? 0) > (createBill.cash ?? 0) &&
        (createBill.card ?? 0) > (createBill.upi ?? 0)
      ) {
        paymentMethod = PaymentMethod.Card;
      } else if (
        (createBill.upi ?? 0) > (createBill.cash ?? 0) &&
        (createBill.upi ?? 0) > (createBill.card ?? 0)
      ) {
        paymentMethod = PaymentMethod.UPI;
      }

      const billAmount = isExpense
        ? itemsTotal > 0
          ? itemsTotal
          : totalPaid > 0
            ? totalPaid
            : Math.abs(
                (createBill.cash ?? 0) +
                  (createBill.card ?? 0) +
                  (createBill.upi ?? 0),
              )
        : totalPaid;

      // Record Expense for Refunds/Returns or Income if totalPaid > 0
      if (billAmount > 0) {
        await this.accountsService.recordTransaction({
          type,
          category,
          amount: billAmount,
          description: `${sourceModule} ${isRefund ? 'Refund' : isReturn ? 'Return' : 'Bill'} #${data.mrn}`,
          paymentMethod,
          sourceModule,
          createdBy: createBill.user,
          transactionDate: new Date(),
        });
      }
    } catch (err) {
      console.error('Error auto recording account transaction from bill:', err);
    }

    return data;
  }

  async getBills(
    user: mongoose.Types.ObjectId | null,
    getBillisDto: GetBillisDto,
  ) {
    const {
      page = 1,
      limit = 10,
      q,
      qEnd,
      method,
      status,
      startDate,
      endDate,
      date,
      activeDate,
      userRole,
      billType,
    } = getBillisDto;
    const skip = (page - 1) * limit;

    const pipeline: any[] = [];

    // Lookup patient first to allow matching on patient fields
    pipeline.push({
      $lookup: {
        from: 'patients',
        localField: 'patient',
        foreignField: '_id',
        as: 'patient',
      },
    });
    pipeline.push({
      $unwind: { path: '$patient', preserveNullAndEmptyArrays: true },
    });

    const match: any = {};
    const qEndFound = qEnd
      ? await this.billingModel.exists({ mrn: qEnd.toUpperCase() })
      : false;

    if (q && qEnd && qEndFound) {
      match.mrn = { $gte: q.toUpperCase(), $lte: qEnd.toUpperCase() };
    } else if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      match.$or = [
        { mrn: searchRegex },
        { 'patient.name': searchRegex },
        { 'patient.mrn': searchRegex },
        { 'patient.phoneNumber': searchRegex },
      ];
    }

    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      match.createdAt = { $gte: dayStart, $lte: dayEnd };
    } else if (startDate && endDate) {
      match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    if (method) {
      if (method === 'Cash') {
        match.cash = { $ne: 0 };
      } else if (method === 'UPI') {
        match.upi = { $ne: 0 };
      } else if (method === 'Card') {
        match.card = { $ne: 0 };
      }
    }

    if (billType && billType !== 'all') {
      const therapyRegex =
        /therapy|acupuncture|panchakarma|cupping|moxibustion|varmam|physio|kizhi|massage|treatment/i;
      const procedureRegex = /procedure/i;
      const receptionRegex =
        /consultation|registration|ncf|refund|fee|opd|doctor|token|reception/i;

      if (billType === 'therapy') {
        match.$or = [{ note: therapyRegex }, { 'items.name': therapyRegex }];
      } else if (billType === 'procedure') {
        match.$or = [{ note: procedureRegex }, { 'items.name': procedureRegex }];
      } else if (billType === 'reception') {
        match.$or = [
          { transactionType: { $in: ['Refund', 'Return'] } },
          { note: receptionRegex },
          { 'items.name': receptionRegex },
        ];
      } else if (billType === 'other') {
        match.$nor = [
          { note: therapyRegex },
          { 'items.name': therapyRegex },
          { note: procedureRegex },
          { 'items.name': procedureRegex },
          { note: receptionRegex },
          { 'items.name': receptionRegex },
          { transactionType: { $in: ['Refund', 'Return'] } },
        ];
      }
    }

    pipeline.push({ $match: match });

    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'creator',
      },
    });
    pipeline.push({
      $unwind: { path: '$creator', preserveNullAndEmptyArrays: true },
    });

    if (userRole) {
      pipeline.push({
        $match: { 'creator.role': new RegExp(`^${userRole}$`, 'i') },
      });
    } else if (user) {
      pipeline.push({
        $match: { user: new mongoose.Types.ObjectId(user) },
      });
    }

    // Add calculations for status filtering
    pipeline.push({
      $addFields: {
        itemsTotal: { $sum: '$items.total' },
        totalPaid: {
          $add: [
            { $ifNull: ['$cash', 0] },
            { $ifNull: ['$card', 0] },
            { $ifNull: ['$upi', 0] },
            { $ifNull: ['$discount', 0] },
          ],
        },
      },
    });

    if (status) {
      if (status === 'Unpaid') {
        pipeline.push({ $match: { totalPaid: 0, transactionType: 'Sale' } });
      } else if (status === 'Paid') {
        pipeline.push({
          $match: {
            transactionType: 'Sale',
            $expr: {
              $lte: [
                '$itemsTotal',
                {
                  $add: ['$totalPaid', { $cond: ['$roundOff', 1, 0] }],
                },
              ],
            },
          },
        });
      } else if (status === 'Partial') {
        pipeline.push({
          $match: {
            transactionType: 'Sale',
            $and: [
              {
                $expr: {
                  $gt: [
                    '$itemsTotal',
                    {
                      $add: ['$totalPaid', { $cond: ['$roundOff', 1, 0] }],
                    },
                  ],
                },
              },
              { totalPaid: { $gt: 0 } },
            ],
          },
        });
      }
    }

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

  async getBill(id: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id))
      throw new BadRequestException('Please provide a valid bill id');
    const data = await this.billingModel
      .findById(id)
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

  async getBillByReportId(reportId: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(reportId))
      throw new BadRequestException('Please provide a valid report id');
    const data = await this.billingModel
      .findOne({ reportId })
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

  async updateBill(
    id: mongoose.Types.ObjectId,
    updateBillDto: UpdateBillingDto,
  ) {
    if (!mongoose.isValidObjectId(id))
      throw new BadRequestException('Please provide a valid bill id');

    const existingBill = await this.billingModel.findById(id);
    if (!existingBill) throw new NotFoundException('Bill is not found.');

    if (existingBill.status === 'Completed') {
      throw new BadRequestException('Cannot edit a completed bill');
    }

    const data = await this.billingModel.findByIdAndUpdate(
      id,
      { $set: updateBillDto },
      { new: true },
    );
    return data;
  }

  async updateBillStatusByReportId(
    reportId: mongoose.Types.ObjectId,
    status: 'Draft' | 'Completed',
  ) {
    if (!mongoose.isValidObjectId(reportId))
      throw new BadRequestException('Please provide a valid report id');

    const data = await this.billingModel.findOneAndUpdate(
      { reportId },
      { $set: { status } },
      { new: true },
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
    user?: mongoose.Types.ObjectId,
  ) {
    const data = await this.billingModel.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          cash: addPaymentDto.cash,
          upi: addPaymentDto.upi,
          card: addPaymentDto.card,
        },
      },
      { new: true },
    );
    if (!data) throw new NotFoundException('Bill is not found.');

    const totalNewPaid =
      (addPaymentDto.cash ?? 0) +
      (addPaymentDto.card ?? 0) +
      (addPaymentDto.upi ?? 0);
    if (totalNewPaid > 0) {
      try {
        const sourceModule = await this.determineSourceModule(
          user || data.user,
        );
        const isRefund =
          data.transactionType === 'Refund' ||
          (data.items &&
            data.items.some((i: any) =>
              String(i.name || '')
                .toLowerCase()
                .includes('refund'),
            ));
        const isReturn = data.transactionType === 'Return';
        const isExpense = isRefund || isReturn;

        const type = isExpense
          ? TransactionType.Expense
          : TransactionType.Income;
        let category: string;
        if (isRefund) {
          category = ExpenseCategory.Refund;
        } else if (isReturn) {
          category = ExpenseCategory.SalesReturn;
        } else {
          const isTherapy =
            String(data.note || '')
              .toLowerCase()
              .includes('therapy') ||
            (data.items &&
              data.items.some((i: any) =>
                String(i.name || '')
                  .toLowerCase()
                  .includes('therapy'),
              ));

          const isProcedure =
            String(data.note || '')
              .toLowerCase()
              .includes('procedure') ||
            (data.items &&
              data.items.some((i: any) =>
                String(i.name || '')
                  .toLowerCase()
                  .includes('procedure'),
              ));

          if (isTherapy) category = IncomeCategory.TherapyIncome;
          else if (isProcedure) category = IncomeCategory.ProcedureIncome;
          else if (sourceModule === SourceModule.Doctor)
            category = IncomeCategory.ConsultationFee;
          else if (sourceModule === SourceModule.Lab)
            category = IncomeCategory.LaboratoryIncome;
          else if (sourceModule === SourceModule.Reception)
            category = IncomeCategory.ConsultationFee;
          else category = IncomeCategory.MedicineSale;
        }

        let paymentMethod = PaymentMethod.Cash;
        if (
          (addPaymentDto.card ?? 0) > (addPaymentDto.cash ?? 0) &&
          (addPaymentDto.card ?? 0) > (addPaymentDto.upi ?? 0)
        ) {
          paymentMethod = PaymentMethod.Card;
        } else if (
          (addPaymentDto.upi ?? 0) > (addPaymentDto.cash ?? 0) &&
          (addPaymentDto.upi ?? 0) > (addPaymentDto.card ?? 0)
        ) {
          paymentMethod = PaymentMethod.UPI;
        }

        await this.accountsService.recordTransaction({
          type,
          category,
          amount: totalNewPaid,
          description: `${sourceModule} ${isRefund ? 'Refund' : isReturn ? 'Return' : 'Payment'} for Bill #${data.mrn}`,
          paymentMethod,
          sourceModule,
          createdBy: user || data.user,
          transactionDate: new Date(),
        });
      } catch (err) {
        console.error(
          'Error recording account transaction in addPayment:',
          err,
        );
      }
    }

    return data;
  }

  async markAsPaid(id: mongoose.Types.ObjectId, markAsPaidDto: MarkAsPaidDto) {
    const existingBill = await this.billingModel.findById(id);
    if (!existingBill) throw new NotFoundException('Bill is not found.');

    const addedCash = Math.max(0, Number(markAsPaidDto.cash) || 0);
    const addedCard = Math.max(0, Number(markAsPaidDto.card) || 0);
    const addedUpi = Math.max(0, Number(markAsPaidDto.upi) || 0);
    const addedDiscount = Math.max(0, Number(markAsPaidDto.discount) || 0);

    const currentCash = existingBill.cash || 0;
    const currentCard = existingBill.card || 0;
    const currentUpi = existingBill.upi || 0;
    const currentDiscount = existingBill.discount || 0;

    const newCash = currentCash + addedCash;
    const newCard = currentCard + addedCard;
    const newUpi = currentUpi + addedUpi;
    const newDiscount = currentDiscount + addedDiscount;

    const totalPaid = newCash + newCard + newUpi + newDiscount;
    const itemsTotal = (existingBill.items || []).reduce(
      (a, b) => a + (b.total ?? 0),
      0,
    );
    const roundOffAmount = existingBill.roundOff ? itemsTotal % 1 : 0;
    const netTotal = itemsTotal - roundOffAmount;

    const updateObj: any = {
      $inc: {
        cash: addedCash,
        card: addedCard,
        upi: addedUpi,
        discount: addedDiscount,
      },
    };

    if (totalPaid >= netTotal - 0.01) {
      updateObj.$set = { status: 'Completed' };
    }

    const data = await this.billingModel.findOneAndUpdate(
      { _id: id },
      updateObj,
      { new: true },
    );
    if (!data) throw new NotFoundException('Bill is not found.');

    const totalPayment = addedCash + addedCard + addedUpi;
    if (totalPayment > 0) {
      try {
        const sourceModule = await this.determineSourceModule(data.user);
        const isRefund =
          data.transactionType === 'Refund' ||
          (data.items &&
            data.items.some((i: any) =>
              String(i.name || '')
                .toLowerCase()
                .includes('refund'),
            ));
        const isReturn = data.transactionType === 'Return';
        const isExpense = isRefund || isReturn;

        const type = isExpense
          ? TransactionType.Expense
          : TransactionType.Income;
        let category: string;
        if (isRefund) {
          category = ExpenseCategory.Refund;
        } else if (isReturn) {
          category = ExpenseCategory.SalesReturn;
        } else {
          const isTherapy =
            String(data.note || '')
              .toLowerCase()
              .includes('therapy') ||
            (data.items &&
              data.items.some((i: any) =>
                String(i.name || '')
                  .toLowerCase()
                  .includes('therapy'),
              ));

          const isProcedure =
            String(data.note || '')
              .toLowerCase()
              .includes('procedure') ||
            (data.items &&
              data.items.some((i: any) =>
                String(i.name || '')
                  .toLowerCase()
                  .includes('procedure'),
              ));

          if (isTherapy) category = IncomeCategory.TherapyIncome;
          else if (isProcedure) category = IncomeCategory.ProcedureIncome;
          else if (sourceModule === SourceModule.Doctor)
            category = IncomeCategory.ConsultationFee;
          else if (sourceModule === SourceModule.Lab)
            category = IncomeCategory.LaboratoryIncome;
          else if (sourceModule === SourceModule.Reception)
            category = IncomeCategory.ConsultationFee;
          else category = IncomeCategory.MedicineSale;
        }

        const paymentsToRecord: { amount: number; method: PaymentMethod }[] = [
          { amount: addedCash, method: PaymentMethod.Cash },
          { amount: addedCard, method: PaymentMethod.Card },
          { amount: addedUpi, method: PaymentMethod.UPI },
        ];

        for (const p of paymentsToRecord) {
          if (p.amount > 0) {
            await this.accountsService.recordTransaction({
              type,
              category,
              amount: p.amount,
              description: `${sourceModule} ${isRefund ? 'Refund' : isReturn ? 'Return' : 'Payment'} for Bill #${data.mrn} (${p.method})`,
              paymentMethod: p.method,
              sourceModule,
              createdBy: data.user,
              transactionDate: new Date(),
            });
          }
        }
      } catch (err) {
        console.error(
          'Error recording account transaction in markAsPaid:',
          err,
        );
      }
    }

    return data;
  }

  async getBillDropDown(getBillDropDownDto: GetBillDropdownDto) {
    const { query = '' } = getBillDropDownDto;

    const data = await this.billingModel
      .find({ mrn: new RegExp(query, 'i'), transactionType: 'Sale' })
      .limit(10)
      .select('user patient mrn')
      .populate('patient', 'name phoneNumber gender dateOfBirth mrn address')
      .lean()
      .exec();
    return data;
  }

  async getSingleCustomerBill(q: string, role?: string) {
    let data = await this.billingModel
      .find({ patient: q })
      .populate('patient', 'name phoneNumber gender dateOfBirth mrn address')
      .populate('user', 'name role email')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (role) {
      data = data.filter((bill: any) => {
        const userRole = (bill.user?.role || '').toLowerCase();
        if (role.toLowerCase() === 'pharmacy') {
          if (userRole.includes('pharmacy')) return true;
          if (userRole === 'doctor' || userRole === 'lab' || userRole === 'reception') return false;
          if (bill.reportId || bill.tokenNumber || bill.token) return false;
          const noteStr = String(bill.note || '').toLowerCase();
          if (/consultation|registration|token|ncf|therapy|procedure/i.test(noteStr)) return false;
          const items = bill.items || [];
          if (items.length === 0) return false;
          return items.some((it: any) => {
            const n = String(typeof it.name === 'string' ? it.name : it.name?.name || '').toLowerCase();
            return !/consultation|registration|token|ncf|therapy|procedure|lab|blood|scan|x-ray|ecg/i.test(n);
          });
        }
        return new RegExp(`^${role}$`, 'i').test(userRole);
      });
    }

    for (const bill of data) {
      if (bill.doctor && mongoose.isValidObjectId(bill.doctor)) {
        const doc = await this.usersService.getUserById(bill.doctor);
        if (doc) {
          (bill as any).doctor = doc;
        }
      }
    }
    return data;
  }
}
