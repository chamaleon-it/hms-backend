import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReturnDto } from './dto/create-return.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Return, ReturnReason } from './schemas/return.schema';
import mongoose, { Model } from 'mongoose';
import { ItemsService } from '../items/items.service';
import { Billing } from 'src/billing/schemas/billing.schema';
import configuration from 'src/config/configuration';

import { AccountsService } from 'src/accounts/accounts.service';
import {
  ExpenseCategory,
  PaymentMethod,
  SourceModule,
  TransactionType,
} from 'src/accounts/enums/account-transaction.enum';
import { nextReturnBillNumber } from './return-bill-no';

@Injectable()
export class ReturnService {
  constructor(
    @InjectModel(Return.name) private returnModel: Model<Return>,
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    private readonly itemsService: ItemsService,
    private readonly accountsService: AccountsService,
  ) {}

  async create(createReturnDto: CreateReturnDto) {
    const saleBillNo = saleBillNumber(createReturnDto.billNo);
    const returnTotal = createReturnDto.items.reduce(
      (acc, item) => acc + Number(item.unitPrice) * Number(item.quantity),
      0,
    );
    const billItems = await Promise.all(
      createReturnDto.items.map(async (e) => {
        const item = await this.itemsService.getItem(e.name);
        const quantity = e.quantity;
        const total = e.unitPrice * quantity;
        return {
          name: item.name,
          quantity,
          unitPrice: e.unitPrice,
          total,
        };
      }),
    );

    let data: Return | undefined;
    let billNo = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      billNo = await this.allocateReturnBillNo();
      try {
        data = await this.returnModel.create({
          ...createReturnDto,
          billNo,
          saleBillNo,
        });
        await this.billingModel.create({
          patient: createReturnDto.patient,
          user: configuration().in_house_pharmacy_id,
          items: billItems,
          mrn: billNo,
          salesMRN: saleBillNo,
          transactionType: 'Return',
          cash: returnTotal,
        });
        break;
      } catch (error) {
        if (data && '_id' in data) {
          await this.returnModel.deleteOne({ _id: data._id });
          data = undefined;
        }
        if (!isDuplicateKey(error) || attempt === 4) {
          throw error;
        }
      }
    }

    // Auto record Expense transaction in Accounts for Pharmacy Return
    try {
      await this.accountsService.recordTransaction({
        type: TransactionType.Expense,
        category: ExpenseCategory.SalesReturn,
        amount: returnTotal,
        description: `Pharmacy Sales Return Bill #${billNo}`,
        paymentMethod: PaymentMethod.Cash,
        sourceModule: SourceModule.Pharmacy,
        createdBy: configuration().in_house_pharmacy_id,
        transactionDate: new Date(),
      });
    } catch (err) {
      console.error(
        'Error recording account transaction for Pharmacy Return:',
        err,
      );
    }

    const validReasonForQuantityAdd = [
      ReturnReason.AdverseReaction,
      ReturnReason.DoctorChangedRx,
      ReturnReason.NotRequired,
      ReturnReason.Other,
      ReturnReason.QualityIssue,
      ReturnReason.WrongItem,
    ];
    const items = createReturnDto.items.filter(
      (item) => validReasonForQuantityAdd.includes(item.reason) || !item.reason,
    );
    for (const item of items) {
      await this.itemsService.increaseItem(item.name, item.quantity);
    }

    return data;
  }

  async findAll() {
    const data = await this.returnModel
      .find()
      .sort({ createdAt: -1 })
      .populate('patient', 'name phoneNumber email address mrn')
      .populate('order', 'mrn')
      .populate(
        'items.name',
        '-createdAt -updatedAt -expiryDate -purchasePrice ',
      )
      .lean()
      .exec();
    return data;
  }

  async findOne(id: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Please provide a valid return id');
    }
    const data = await this.returnModel
      .findById(id)
      .populate('patient', 'name phoneNumber email address mrn')
      .populate('order', 'mrn')
      .populate(
        'items.name',
        '-createdAt -updatedAt -expiryDate -purchasePrice ',
      )
      .lean()
      .exec();

    if (!data) {
      throw new NotFoundException(
        'Sorry no return data available for this id.',
      );
    }
    return data;
  }

  async findByPatient(patientId: string) {
    if (!mongoose.isValidObjectId(patientId)) {
      throw new BadRequestException('Please provide a valid patient id');
    }
    const data = await this.returnModel
      .find({ patient: patientId })
      // .populate('patient', 'name phoneNumber email address mrn')
      .populate('order', 'mrn')
      .populate(
        'items.name',
        '-createdAt -updatedAt -expiryDate -purchasePrice ',
      )
      .lean()
      .exec();

    return data;
  }

  private async allocateReturnBillNo() {
    const [bills, returns] = await Promise.all([
      this.billingModel
        .find({ mrn: /^R-\d+$/ })
        .select('mrn')
        .lean()
        .exec(),
      this.returnModel
        .find({ billNo: /^R-\d+$/ })
        .select('billNo')
        .lean()
        .exec(),
    ]);
    return nextReturnBillNumber([
      ...bills.map((bill) => bill.mrn),
      ...returns.map((entry) => entry.billNo),
    ]);
  }
}

function saleBillNumber(billNo?: string) {
  const value = String(billNo ?? '').trim();
  if (!value || value === '-' || value === 'undefined') return undefined;
  return value;
}

function isDuplicateKey(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
}
