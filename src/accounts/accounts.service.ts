import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  AccountTransaction,
  AccountTransactionDocument,
} from './schemas/account-transaction.schema';
import { CreateAccountTransactionDto } from './dto/create-account-transaction.dto';
import { UpdateAccountTransactionDto } from './dto/update-account-transaction.dto';
import { GetAccountTransactionsDto } from './dto/get-account-transactions.dto';
import {
  ExpenseCategory,
  IncomeCategory,
  TransactionType,
} from './enums/account-transaction.enum';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(AccountTransaction.name)
    private accountTransactionModel: Model<AccountTransactionDocument>,
  ) {}

  private async generateTransactionId(): Promise<string> {
    const lastDoc = await this.accountTransactionModel
      .findOne({}, { transactionId: 1 })
      .sort({ createdAt: -1 })
      .exec();

    let nextNum = 1;
    if (lastDoc && lastDoc.transactionId) {
      const match = lastDoc.transactionId.match(/\d+/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }
    return `TXN-${String(nextNum).padStart(5, '0')}`;
  }

  private validateCategory(type: TransactionType, category: string) {
    const expenseCategories: string[] = Object.values(ExpenseCategory);
    const incomeCategories: string[] = Object.values(IncomeCategory);

    if (type === TransactionType.Expense) {
      if (!expenseCategories.includes(category)) {
        throw new BadRequestException(
          `Invalid category '${category}' for Expense. Allowed: ${expenseCategories.join(', ')}`,
        );
      }
    } else if (type === TransactionType.Income) {
      if (!incomeCategories.includes(category)) {
        throw new BadRequestException(
          `Invalid category '${category}' for Income. Allowed: ${incomeCategories.join(', ')}`,
        );
      }
    }
  }

  async create(
    dto: CreateAccountTransactionDto,
    userId: string | mongoose.Types.ObjectId,
  ) {
    this.validateCategory(dto.type, dto.category);
    const transactionId = await this.generateTransactionId();

    const newTransaction = new this.accountTransactionModel({
      ...dto,
      transactionId,
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    return await newTransaction.save();
  }

  async findAll(query: GetAccountTransactionsDto) {
    const {
      page = 1,
      limit = 10,
      q,
      type,
      category,
      startDate,
      endDate,
      sortBy = 'transactionDate',
      sortOrder = 'desc',
    } = query;

    const filter: any = { isDeleted: false };

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) {
        filter.transactionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        const eod = new Date(endDate);
        eod.setHours(23, 59, 59, 999);
        filter.transactionDate.$lte = eod;
      }
    }

    if (q) {
      filter.$or = [
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { transactionId: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } },
      ];
    }

    const sortOption: any = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total, summaryResult] = await Promise.all([
      this.accountTransactionModel
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .populate('createdBy', 'name email role')
        .populate('updatedBy', 'name email role')
        .exec(),
      this.accountTransactionModel.countDocuments(filter).exec(),
      this.accountTransactionModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;

    summaryResult.forEach((item) => {
      if (item._id === TransactionType.Income) {
        totalIncome = item.totalAmount;
      } else if (item._id === TransactionType.Expense) {
        totalExpense = item.totalAmount;
      }
    });

    const netBalance = totalIncome - totalExpense;

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      summary: {
        totalIncome,
        totalExpense,
        netBalance,
      },
    };
  }

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction ID format');
    }

    const transaction = await this.accountTransactionModel
      .findOne({ _id: id, isDeleted: false })
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role')
      .exec();

    if (!transaction) {
      throw new NotFoundException('Account transaction not found');
    }

    return transaction;
  }

  async update(
    id: string,
    dto: UpdateAccountTransactionDto,
    userId: string | mongoose.Types.ObjectId,
  ) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction ID format');
    }

    const existing = await this.accountTransactionModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!existing) {
      throw new NotFoundException('Account transaction not found');
    }

    const targetType = dto.type || existing.type;
    const targetCategory = dto.category || existing.category;
    this.validateCategory(targetType, targetCategory);

    const updated = await this.accountTransactionModel
      .findByIdAndUpdate(
        id,
        {
          ...dto,
          updatedBy: new mongoose.Types.ObjectId(userId),
        },
        { new: true },
      )
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role')
      .exec();

    return updated;
  }

  async remove(id: string, userId: string | mongoose.Types.ObjectId) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid transaction ID format');
    }

    const existing = await this.accountTransactionModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!existing) {
      throw new NotFoundException('Account transaction not found');
    }

    return await this.accountTransactionModel.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        updatedBy: new mongoose.Types.ObjectId(userId),
      },
      { new: true },
    );
  }
}
