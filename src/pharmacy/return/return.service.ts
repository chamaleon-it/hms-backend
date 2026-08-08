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

@Injectable()
export class ReturnService {
  constructor(
    @InjectModel(Return.name) private returnModel: Model<Return>,
    @InjectModel(Billing.name) private billingModel: Model<Billing>,
    private readonly itemsService: ItemsService,
    private readonly accountsService: AccountsService,
  ) {}

  async create(createReturnDto: CreateReturnDto) {
    createReturnDto.billNo = `R-${createReturnDto.billNo}`;
    const existingBilling = await this.billingModel.exists({
      mrn: createReturnDto.billNo,
    });
    if (existingBilling) {
      throw new BadRequestException(
        'A return with this bill number already exists. Please use a unique bill number.',
      );
    }
    const data = await this.returnModel.create(createReturnDto);

    const returnTotal = createReturnDto.items.reduce(
      (acc, item) => acc + Number(item.unitPrice) * Number(item.quantity),
      0,
    );

    await this.billingModel.create({
      patient: createReturnDto.patient,
      user: configuration().in_house_pharmacy_id,
      items: await Promise.all(
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
      ),
      mrn: createReturnDto.billNo,
      transactionType: 'Return',
      cash: returnTotal,
    });

    // Auto record Expense transaction in Accounts for Pharmacy Return
    try {
      await this.accountsService.recordTransaction({
        type: TransactionType.Expense,
        category: ExpenseCategory.SalesReturn,
        amount: returnTotal,
        description: `Pharmacy Sales Return Bill #${createReturnDto.billNo}`,
        paymentMethod: PaymentMethod.Cash,
        sourceModule: SourceModule.Pharmacy,
        createdBy: configuration().in_house_pharmacy_id,
        transactionDate: new Date(),
      });
    } catch (err) {
      console.error('Error recording account transaction for Pharmacy Return:', err);
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
    items.forEach(async (item) => {
      await this.itemsService.increaseItem(item.name, item.quantity);
    });

    return data;
  }

  async findAll() {
    const data = await this.returnModel
      .find()
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
}
