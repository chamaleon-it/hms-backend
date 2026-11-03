"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importStar(require("mongoose"));
const account_transaction_schema_1 = require("./schemas/account-transaction.schema");
const account_transaction_enum_1 = require("./enums/account-transaction.enum");
const tally_service_1 = require("../tally/tally.service");
let AccountsService = class AccountsService {
    accountTransactionModel;
    tallyService;
    constructor(accountTransactionModel, tallyService) {
        this.accountTransactionModel = accountTransactionModel;
        this.tallyService = tallyService;
    }
    pushToTally(tx) {
        if (!tx || !this.tallyService)
            return;
        void this.tallyService.syncAccountTransaction(tx).catch((err) => {
            console.error('Tally sync error:', err?.message || err);
        });
    }
    async generateTransactionId() {
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
    validateCategory(type, category) {
        const expenseCategories = Object.values(account_transaction_enum_1.ExpenseCategory);
        const incomeCategories = Object.values(account_transaction_enum_1.IncomeCategory);
        if (type === account_transaction_enum_1.TransactionType.Expense) {
            if (!expenseCategories.includes(category)) {
                throw new common_1.BadRequestException(`Invalid category '${category}' for Expense. Allowed: ${expenseCategories.join(', ')}`);
            }
        }
        else if (type === account_transaction_enum_1.TransactionType.Income) {
            if (!incomeCategories.includes(category)) {
                throw new common_1.BadRequestException(`Invalid category '${category}' for Income. Allowed: ${incomeCategories.join(', ')}`);
            }
        }
    }
    async recordTransaction(params) {
        if (!params.amount || params.amount <= 0)
            return null;
        try {
            const transactionId = await this.generateTransactionId();
            let createdByObjectId;
            if (params.createdBy &&
                mongoose_2.default.Types.ObjectId.isValid(params.createdBy.toString())) {
                createdByObjectId = new mongoose_2.default.Types.ObjectId(params.createdBy.toString());
            }
            else {
                createdByObjectId = new mongoose_2.default.Types.ObjectId('000000000000000000000000');
            }
            const newTransaction = new this.accountTransactionModel({
                transactionId,
                type: params.type,
                category: params.category,
                amount: Math.abs(params.amount),
                description: params.description,
                paymentMethod: params.paymentMethod || account_transaction_enum_1.PaymentMethod.Cash,
                sourceModule: params.sourceModule || account_transaction_enum_1.SourceModule.Uncategorised,
                ledgerGroup: params.ledgerGroup,
                costCentre: params.costCentre,
                notes: params.notes,
                transactionDate: params.transactionDate || new Date(),
                createdBy: createdByObjectId,
            });
            const saved = await newTransaction.save();
            if (!params.deferTally)
                this.pushToTally(saved);
            return saved;
        }
        catch (err) {
            console.error(`Failed to record transaction for module ${params.sourceModule}:`, err);
            return null;
        }
    }
    async sumMedicineSaleReceipts(mrn) {
        const trimmed = String(mrn || '').trim();
        if (!trimmed)
            return 0;
        const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const [row] = await this.accountTransactionModel.aggregate([
            {
                $match: {
                    isDeleted: { $ne: true },
                    type: account_transaction_enum_1.TransactionType.Income,
                    category: account_transaction_enum_1.IncomeCategory.MedicineSale,
                    description: { $regex: `Bill #${escaped}(?:\\s|\\(|$)` },
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        return Number(row?.total) || 0;
    }
    async create(dto, userId) {
        this.validateCategory(dto.type, dto.category);
        const transactionId = await this.generateTransactionId();
        const newTransaction = new this.accountTransactionModel({
            ...dto,
            sourceModule: dto.sourceModule || account_transaction_enum_1.SourceModule.Uncategorised,
            transactionId,
            createdBy: new mongoose_2.default.Types.ObjectId(userId),
        });
        const saved = await newTransaction.save();
        this.pushToTally(saved);
        return saved;
    }
    async findAll(query) {
        const { page = 1, limit = 10, q, type, category, paymentMethod, sourceModule, startDate, endDate, sortBy = 'transactionDate', sortOrder = 'desc', } = query;
        const filter = { isDeleted: false };
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
        const sortOption = {};
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
            if (item._id === account_transaction_enum_1.TransactionType.Income) {
                totalIncome = item.totalAmount;
            }
            else if (item._id === account_transaction_enum_1.TransactionType.Expense) {
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
    async getAnalytics(query) {
        const { startDate, endDate, type, category, sourceModule, period = 'monthly', } = query;
        const filter = { isDeleted: false };
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
        const summaryAgg = await this.accountTransactionModel.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalIncome: {
                        $sum: {
                            $cond: [{ $eq: ['$type', account_transaction_enum_1.TransactionType.Income] }, '$amount', 0],
                        },
                    },
                    totalExpense: {
                        $sum: {
                            $cond: [
                                { $eq: ['$type', account_transaction_enum_1.TransactionType.Expense] },
                                '$amount',
                                0,
                            ],
                        },
                    },
                    incomeCount: {
                        $sum: {
                            $cond: [{ $eq: ['$type', account_transaction_enum_1.TransactionType.Income] }, 1, 0],
                        },
                    },
                    expenseCount: {
                        $sum: {
                            $cond: [{ $eq: ['$type', account_transaction_enum_1.TransactionType.Expense] }, 1, 0],
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
        const profitMargin = totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : 0;
        const avgTransactionValue = summaryRaw.totalTransactions > 0
            ? Math.round(summaryRaw.totalAmountSum / summaryRaw.totalTransactions)
            : 0;
        const dateFormat = period === 'daily' ? '%Y-%m-%d' : period === 'yearly' ? '%Y' : '%Y-%m';
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
        const trendMap = {};
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
            if (item._id.type === account_transaction_enum_1.TransactionType.Income) {
                trendMap[dateKey].income = item.total;
            }
            else if (item._id.type === account_transaction_enum_1.TransactionType.Expense) {
                trendMap[dateKey].expense = item.total;
            }
            trendMap[dateKey].net =
                trendMap[dateKey].income - trendMap[dateKey].expense;
        });
        const trendData = Object.values(trendMap);
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
        const expenseCategories = [];
        const incomeCategories = [];
        categoryAgg.forEach((item) => {
            const categoryName = item._id.category;
            const catType = item._id.type;
            const amount = item.total;
            if (catType === account_transaction_enum_1.TransactionType.Expense) {
                const percentage = totalExpense > 0
                    ? Number(((amount / totalExpense) * 100).toFixed(1))
                    : 0;
                expenseCategories.push({
                    name: categoryName,
                    amount,
                    count: item.count,
                    percentage,
                });
            }
            else if (catType === account_transaction_enum_1.TransactionType.Income) {
                const percentage = totalIncome > 0
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
        const paymentMethodAgg = await this.accountTransactionModel.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: { paymentMethod: '$paymentMethod', type: '$type' },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);
        const methodsMap = {
            Cash: {
                name: 'Cash',
                totalAmount: 0,
                incomeAmount: 0,
                expenseAmount: 0,
                count: 0,
                percentage: 0,
            },
            Card: {
                name: 'Card',
                totalAmount: 0,
                incomeAmount: 0,
                expenseAmount: 0,
                count: 0,
                percentage: 0,
            },
            UPI: {
                name: 'UPI',
                totalAmount: 0,
                incomeAmount: 0,
                expenseAmount: 0,
                count: 0,
                percentage: 0,
            },
        };
        let totalMethodVolume = 0;
        paymentMethodAgg.forEach((item) => {
            const rawMethod = item._id.paymentMethod || 'Cash';
            const mType = item._id.type;
            const amt = item.total || 0;
            const cnt = item.count || 0;
            const normalized = rawMethod === account_transaction_enum_1.PaymentMethod.Card
                ? 'Card'
                : rawMethod === account_transaction_enum_1.PaymentMethod.UPI
                    ? 'UPI'
                    : 'Cash';
            if (!methodsMap[normalized]) {
                methodsMap[normalized] = {
                    name: normalized,
                    totalAmount: 0,
                    incomeAmount: 0,
                    expenseAmount: 0,
                    count: 0,
                    percentage: 0,
                };
            }
            methodsMap[normalized].totalAmount += amt;
            methodsMap[normalized].count += cnt;
            totalMethodVolume += amt;
            if (mType === account_transaction_enum_1.TransactionType.Income) {
                methodsMap[normalized].incomeAmount += amt;
            }
            else if (mType === account_transaction_enum_1.TransactionType.Expense) {
                methodsMap[normalized].expenseAmount += amt;
            }
        });
        Object.values(methodsMap).forEach((m) => {
            m.percentage =
                totalMethodVolume > 0
                    ? Number(((m.totalAmount / totalMethodVolume) * 100).toFixed(1))
                    : 0;
        });
        const paymentMethods = Object.values(methodsMap);
        const paymentTrendAgg = await this.accountTransactionModel.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: {
                        dateKey: {
                            $dateToString: { format: dateFormat, date: '$transactionDate' },
                        },
                        paymentMethod: '$paymentMethod',
                    },
                    total: { $sum: '$amount' },
                },
            },
            { $sort: { '_id.dateKey': 1 } },
        ]);
        const paymentTrendMap = {};
        paymentTrendAgg.forEach((item) => {
            const dateKey = item._id.dateKey;
            const rawMethod = item._id.paymentMethod || 'Cash';
            const amt = item.total || 0;
            const methodKey = rawMethod === account_transaction_enum_1.PaymentMethod.Card
                ? 'Card'
                : rawMethod === account_transaction_enum_1.PaymentMethod.UPI
                    ? 'UPI'
                    : 'Cash';
            if (!paymentTrendMap[dateKey]) {
                paymentTrendMap[dateKey] = {
                    label: dateKey,
                    Cash: 0,
                    Card: 0,
                    UPI: 0,
                    total: 0,
                };
            }
            paymentTrendMap[dateKey][methodKey] += amt;
            paymentTrendMap[dateKey].total += amt;
        });
        const paymentMethodTrend = Object.values(paymentTrendMap);
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
            paymentMethods,
            paymentMethodTrend,
        };
    }
    async findOne(id) {
        if (!mongoose_2.default.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid transaction ID format');
        }
        const transaction = await this.accountTransactionModel
            .findOne({ _id: id, isDeleted: false })
            .populate('createdBy', 'name email role')
            .populate('updatedBy', 'name email role')
            .exec();
        if (!transaction) {
            throw new common_1.NotFoundException('Account transaction not found');
        }
        return transaction;
    }
    async update(id, dto, userId) {
        if (!mongoose_2.default.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid transaction ID format');
        }
        const existing = await this.accountTransactionModel.findOne({
            _id: id,
            isDeleted: false,
        });
        if (!existing) {
            throw new common_1.NotFoundException('Account transaction not found');
        }
        const targetType = dto.type || existing.type;
        const targetCategory = dto.category || existing.category;
        this.validateCategory(targetType, targetCategory);
        const updated = await this.accountTransactionModel
            .findByIdAndUpdate(id, {
            ...dto,
            updatedBy: new mongoose_2.default.Types.ObjectId(userId),
        }, { new: true })
            .populate('createdBy', 'name email role')
            .populate('updatedBy', 'name email role')
            .exec();
        return updated;
    }
    async remove(id, userId) {
        if (!mongoose_2.default.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid transaction ID format');
        }
        const existing = await this.accountTransactionModel.findOne({
            _id: id,
            isDeleted: false,
        });
        if (!existing) {
            throw new common_1.NotFoundException('Account transaction not found');
        }
        return await this.accountTransactionModel.findByIdAndUpdate(id, {
            isDeleted: true,
            deletedAt: new Date(),
            updatedBy: new mongoose_2.default.Types.ObjectId(userId),
        }, { new: true });
    }
};
exports.AccountsService = AccountsService;
exports.AccountsService = AccountsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(account_transaction_schema_1.AccountTransaction.name)),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => tally_service_1.TallyService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        tally_service_1.TallyService])
], AccountsService);
//# sourceMappingURL=accounts.service.js.map