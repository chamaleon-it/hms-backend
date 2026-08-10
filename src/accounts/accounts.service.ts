import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
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
import { GetAccountAnalyticsDto } from './dto/get-account-analytics.dto';
import {
  ExpenseCategory,
  IncomeCategory,
  PaymentMethod,
  SourceModule,
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

  async recordTransaction(params: {
    type: TransactionType;
    category: string;
    amount: number;
    description: string;
    paymentMethod?: PaymentMethod;
    sourceModule?: SourceModule;
    notes?: string;
    createdBy?: string | mongoose.Types.ObjectId;
    transactionDate?: Date;
  }) {
    if (!params.amount || params.amount <= 0) return null;

    try {
      const transactionId = await this.generateTransactionId();
      let createdByObjectId: mongoose.Types.ObjectId;

      if (
        params.createdBy &&
        mongoose.Types.ObjectId.isValid(params.createdBy.toString())
      ) {
        createdByObjectId = new mongoose.Types.ObjectId(
          params.createdBy.toString(),
        );
      } else {
        // Fallback default admin / system ObjectId
        createdByObjectId = new mongoose.Types.ObjectId(
          '000000000000000000000000',
        );
      }

      const newTransaction = new this.accountTransactionModel({
        transactionId,
        type: params.type,
        category: params.category,
        amount: Math.abs(params.amount),
        description: params.description,
        paymentMethod: params.paymentMethod || PaymentMethod.Cash,
        sourceModule: params.sourceModule || SourceModule.Uncategorised,
        notes: params.notes,
        transactionDate: params.transactionDate || new Date(),
        createdBy: createdByObjectId,
      });

      return await newTransaction.save();
    } catch (err) {
      console.error(
        `Failed to record transaction for module ${params.sourceModule}:`,
        err,
      );
      return null;
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
      sourceModule: dto.sourceModule || SourceModule.Uncategorised,
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
      paymentMethod,
      sourceModule,
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

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    if (sourceModule) {
      filter.sourceModule = sourceModule;
    }

    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) {
        const bod = new Date(startDate);
        bod.setHours(0, 0, 0, 0);
        filter.transactionDate.$gte = bod;
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
        { paymentMethod: { $regex: q, $options: 'i' } },
        { sourceModule: { $regex: q, $options: 'i' } },
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

  async getAnalytics(query: GetAccountAnalyticsDto) {
    const {
      startDate,
      endDate,
      type,
      category,
      sourceModule,
      period = 'monthly',
    } = query;

    const filter: any = { isDeleted: false };

    if (type) {
      filter.type = type;
    }
    if (category) {
      filter.category = category;
    }
    if (sourceModule) {
      filter.sourceModule = sourceModule;
    }

    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) {
        const bod = new Date(startDate);
        bod.setHours(0, 0, 0, 0);
        filter.transactionDate.$gte = bod;
      }
      if (endDate) {
        const eod = new Date(endDate);
        eod.setHours(23, 59, 59, 999);
        filter.transactionDate.$lte = eod;
      }
    }

    // 1. Summary aggregations
    const summaryAgg = await this.accountTransactionModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', TransactionType.Income] }, '$amount', 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [
                { $eq: ['$type', TransactionType.Expense] },
                '$amount',
                0,
              ],
            },
          },
          incomeCount: {
            $sum: {
              $cond: [{ $eq: ['$type', TransactionType.Income] }, 1, 0],
            },
          },
          expenseCount: {
            $sum: {
              $cond: [{ $eq: ['$type', TransactionType.Expense] }, 1, 0],
            },
          },
          totalTransactions: { $sum: 1 },
          totalAmountSum: { $sum: '$amount' },
        },
      },
    ]);

    const summaryRaw = summaryAgg[0] || {
      totalIncome: 0,
      totalExpense: 0,
      incomeCount: 0,
      expenseCount: 0,
      totalTransactions: 0,
      totalAmountSum: 0,
    };

    const totalIncome = summaryRaw.totalIncome;
    const totalExpense = summaryRaw.totalExpense;
    const netBalance = totalIncome - totalExpense;
    const profitMargin =
      totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : 0;
    const avgTransactionValue =
      summaryRaw.totalTransactions > 0
        ? Math.round(summaryRaw.totalAmountSum / summaryRaw.totalTransactions)
        : 0;

    // 2. Trend & Timeline Aggregation
    const dateFormat =
      period === 'daily' ? '%Y-%m-%d' : period === 'yearly' ? '%Y' : '%Y-%m';

    const trendAgg = await this.accountTransactionModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            dateKey: {
              $dateToString: { format: dateFormat, date: '$transactionDate' },
            },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.dateKey': 1 } },
    ]);

    const trendMap: Record<
      string,
      { label: string; income: number; expense: number; net: number }
    > = {};

    trendAgg.forEach((item) => {
      const dateKey = item._id.dateKey;
      if (!trendMap[dateKey]) {
        trendMap[dateKey] = {
          label: dateKey,
          income: 0,
          expense: 0,
          net: 0,
        };
      }

      if (item._id.type === TransactionType.Income) {
        trendMap[dateKey].income = item.total;
      } else if (item._id.type === TransactionType.Expense) {
        trendMap[dateKey].expense = item.total;
      }
      trendMap[dateKey].net =
        trendMap[dateKey].income - trendMap[dateKey].expense;
    });

    const trendData = Object.values(trendMap);

    // 3. Category Breakdown Aggregation
    const categoryAgg = await this.accountTransactionModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const expenseCategories: any[] = [];
    const incomeCategories: any[] = [];

    categoryAgg.forEach((item) => {
      const categoryName = item._id.category;
      const catType = item._id.type;
      const amount = item.total;

      if (catType === TransactionType.Expense) {
        const percentage =
          totalExpense > 0
            ? Number(((amount / totalExpense) * 100).toFixed(1))
            : 0;
        expenseCategories.push({
          name: categoryName,
          amount,
          count: item.count,
          percentage,
        });
      } else if (catType === TransactionType.Income) {
        const percentage =
          totalIncome > 0
            ? Number(((amount / totalIncome) * 100).toFixed(1))
            : 0;
        incomeCategories.push({
          name: categoryName,
          amount,
          count: item.count,
          percentage,
        });
      }
    });

    return {
      summary: {
        totalIncome,
        totalExpense,
        netBalance,
        profitMargin: Number(profitMargin),
        avgTransactionValue,
        totalTransactions: summaryRaw.totalTransactions,
        incomeCount: summaryRaw.incomeCount,
        expenseCount: summaryRaw.expenseCount,
      },
      trend: trendData,
      categoryBreakdown: {
        expenseCategories,
        incomeCategories,
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
