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
exports.PurchaseEntryService = exports.SUPPLIER_PAYMENT_PAGE_SIZE = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importStar(require("mongoose"));
const purchase_entry_schema_1 = require("./schemas/purchase-entry.schema");
const items_service_1 = require("../../pharmacy/items/items.service");
const supplier_schema_1 = require("../schemas/supplier.schema");
const supplier_payment_schema_1 = require("./schemas/supplier-payment.schema");
const supplier_payment_allocation_1 = require("./supplier-payment.allocation");
const accounts_service_1 = require("../../accounts/accounts.service");
const account_transaction_enum_1 = require("../../accounts/enums/account-transaction.enum");
const ledger_group_1 = require("../../accounts/ledger-group");
exports.SUPPLIER_PAYMENT_PAGE_SIZE = 5;
let PurchaseEntryService = class PurchaseEntryService {
    purchaseEntryModel;
    itemsService;
    supplierModel;
    supplierPaymentModel;
    accountsService;
    constructor(purchaseEntryModel, itemsService, supplierModel, supplierPaymentModel, accountsService) {
        this.purchaseEntryModel = purchaseEntryModel;
        this.itemsService = itemsService;
        this.supplierModel = supplierModel;
        this.supplierPaymentModel = supplierPaymentModel;
        this.accountsService = accountsService;
    }
    async recordPurchasePayment(params) {
        if (!params.amount || params.amount <= 0)
            return;
        try {
            await this.accountsService.recordTransaction({
                type: account_transaction_enum_1.TransactionType.Expense,
                category: account_transaction_enum_1.ExpenseCategory.PurchasePayment,
                amount: params.amount,
                description: params.description,
                paymentMethod: params.paymentMethod,
                sourceModule: account_transaction_enum_1.SourceModule.Purchase,
                ledgerGroup: ledger_group_1.TallyLedgerGroup.Purchase,
                transactionDate: new Date(),
            });
        }
        catch (err) {
            console.error('Error recording account transaction for Purchase Payment:', err);
        }
    }
    async create(createPurchaseEntryDto) {
        if (createPurchaseEntryDto.paidAmount > createPurchaseEntryDto.total) {
            throw new common_1.BadRequestException('Paid Amount is greater than Total Amount');
        }
        if (createPurchaseEntryDto.paidAmount < createPurchaseEntryDto.total) {
            createPurchaseEntryDto.paymentStatus = purchase_entry_schema_1.PaymentStatus.PARTIALLY_PAID;
        }
        if (createPurchaseEntryDto.paidAmount === createPurchaseEntryDto.total) {
            createPurchaseEntryDto.paymentStatus = purchase_entry_schema_1.PaymentStatus.PAID;
        }
        if (createPurchaseEntryDto.paidAmount === 0) {
            createPurchaseEntryDto.paymentStatus = purchase_entry_schema_1.PaymentStatus.PENDING;
        }
        const { grossAmount: _grossAmount, ...entryPayload } = createPurchaseEntryDto;
        const data = await this.purchaseEntryModel.create(entryPayload);
        for (const item of createPurchaseEntryDto.items) {
            const supplier = await this.supplierModel
                .findById(createPurchaseEntryDto.supplier)
                .exec();
            const paidPacks = item.noOfPack != null && item.noOfPack !== undefined
                ? Number(item.noOfPack)
                : Number(item.quantity) || 0;
            const freePacks = Number(item.free) || 0;
            const packSize = Number(item.pack) || 1;
            const stockUnits = (paidPacks + freePacks) * packSize;
            await this.itemsService.addBatchItems(item.item, {
                batchNumber: item.batch,
                quantity: stockUnits,
                expiryDate: item.expiryDate,
                purchasePrice: item.purchasePrice,
                supplier: supplier?.name || '-',
                unitPrice: item.pack ? item.unitPrice / item.pack : item.unitPrice,
                mrp: item.unitPrice,
                packing: item.pack,
                stripCount: paidPacks,
            });
        }
        await this.recordPurchasePayment({
            amount: createPurchaseEntryDto.paidAmount,
            description: `Purchase Payment for Invoice #${createPurchaseEntryDto.invoiceNumber}`,
            paymentMethod: account_transaction_enum_1.PaymentMethod.Cash,
        });
        return data;
    }
    async findAll(query) {
        const filter = {};
        if (query?.supplier) {
            filter.supplier = query.supplier;
        }
        if (query?.status && query.status !== 'all') {
            filter.paymentStatus = query.status;
        }
        if (query?.search && query.search.trim()) {
            filter.invoiceNumber = { $regex: query.search.trim(), $options: 'i' };
        }
        if (query?.startDate || query?.endDate) {
            const dateCond = {};
            if (query.startDate)
                dateCond.$gte = new Date(query.startDate);
            if (query.endDate) {
                const end = new Date(query.endDate);
                if (typeof query.endDate === 'string' && query.endDate.length <= 10) {
                    end.setHours(23, 59, 59, 999);
                }
                dateCond.$lte = end;
            }
            filter.$or = [
                { invoiceDate: dateCond },
                { createdAt: dateCond },
            ];
        }
        const page = Math.max(1, Number(query?.page) || 1);
        const limit = Math.max(1, Number(query?.limit) || 10);
        const skip = (page - 1) * limit;
        const total = await this.purchaseEntryModel.countDocuments(filter).exec();
        const summaryAgg = await this.purchaseEntryModel.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: '$total' },
                    totalPaid: { $sum: '$paidAmount' },
                },
            },
        ]);
        const stats = {
            totalEntries: total,
            totalValue: summaryAgg[0]?.totalValue || 0,
            totalPaid: summaryAgg[0]?.totalPaid || 0,
            totalDue: Math.max(0, (summaryAgg[0]?.totalValue || 0) - (summaryAgg[0]?.totalPaid || 0)),
        };
        const data = await this.purchaseEntryModel
            .find(filter)
            .populate('supplier', 'name phone contactPerson email gstin address paymentTerms balance')
            .populate('items.item', 'name generic hsnCode sku unitPrice')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            stats,
        };
    }
    async findBySupplier(id) {
        return await this.purchaseEntryModel
            .find({ supplier: id })
            .populate('supplier', 'name phone contactPerson email gstin address paymentTerms balance')
            .populate('items.item', 'name generic hsnCode sku unitPrice')
            .sort({ createdAt: -1 })
            .exec();
    }
    async findById(id) {
        return await this.purchaseEntryModel
            .findById(id)
            .populate('supplier', 'name phone contactPerson email gstin address paymentTerms balance')
            .populate('items.item', 'name generic hsnCode sku unitPrice')
            .exec();
    }
    async addPayment(id, addPaymentDto) {
        const data = await this.purchaseEntryModel.findById(id).exec();
        if (!data) {
            throw new common_1.BadRequestException('Purchase Entry Not Found');
        }
        if (data.paidAmount + addPaymentDto.paidAmount > data.total) {
            throw new common_1.BadRequestException('Paid Amount is greater than Total Amount');
        }
        data.paidAmount += addPaymentDto.paidAmount;
        if (data.paidAmount === data.total) {
            data.paymentStatus = purchase_entry_schema_1.PaymentStatus.PAID;
        }
        if (data.paidAmount < data.total) {
            data.paymentStatus = purchase_entry_schema_1.PaymentStatus.PARTIALLY_PAID;
        }
        const saved = await data.save();
        await this.recordPurchasePayment({
            amount: addPaymentDto.paidAmount,
            description: `Purchase Payment for Invoice #${saved.invoiceNumber}`,
            paymentMethod: account_transaction_enum_1.PaymentMethod.Cash,
        });
        return saved;
    }
    async listOpenInvoices(supplierId) {
        await this.requireSupplier(supplierId);
        const entries = await this.purchaseEntryModel
            .find({ supplier: supplierId })
            .select('invoiceNumber invoiceDate total paidAmount paymentStatus')
            .exec();
        const invoices = entries
            .map((entry) => ({
            _id: String(entry._id),
            invoiceNumber: entry.invoiceNumber,
            invoiceDate: entry.invoiceDate,
            total: entry.total,
            paidAmount: entry.paidAmount || 0,
            dueAmount: (0, supplier_payment_allocation_1.dueAmount)(entry.total, entry.paidAmount || 0),
        }))
            .filter((entry) => entry.dueAmount > 0)
            .sort(supplier_payment_allocation_1.compareOpenInvoices);
        const totalDue = invoices.reduce((sum, entry) => sum + Math.round(entry.dueAmount * 100), 0) / 100;
        return { invoices, totalDue };
    }
    async recordSupplierPayment(supplierId, dto) {
        const supplier = await this.requireSupplier(supplierId);
        const entries = await this.purchaseEntryModel
            .find({ supplier: supplierId })
            .exec();
        let plan;
        try {
            plan = (0, supplier_payment_allocation_1.planSupplierPayment)(entries.map((entry) => ({
                id: String(entry._id),
                invoiceNumber: entry.invoiceNumber,
                invoiceDate: entry.invoiceDate,
                total: entry.total,
                paidAmount: entry.paidAmount || 0,
                paymentStatus: entry.paymentStatus,
            })), {
                cash: dto.cash ?? 0,
                card: dto.card ?? 0,
                upi: dto.upi ?? 0,
            });
        }
        catch (error) {
            if (error instanceof supplier_payment_allocation_1.SupplierPaymentError) {
                throw new common_1.BadRequestException(error.message);
            }
            throw error;
        }
        const applied = [];
        try {
            for (const update of plan.updates) {
                const result = await this.purchaseEntryModel.updateOne({ _id: update.id, paidAmount: update.previousPaidAmount }, {
                    $set: {
                        paidAmount: update.paidAmount,
                        paymentStatus: update.paymentStatus,
                    },
                });
                if (result.matchedCount !== 1) {
                    throw new common_1.ConflictException('An invoice changed while recording this payment. Please try again.');
                }
                applied.push(update);
            }
            const payment = await this.supplierPaymentModel.create({
                supplier: supplierId,
                cash: plan.cash,
                card: plan.card,
                upi: plan.upi,
                total: plan.total,
                date: new Date(),
                allocations: plan.allocations.map((allocation) => ({
                    purchaseEntry: allocation.purchaseEntryId,
                    invoiceNumber: allocation.invoiceNumber,
                    amount: allocation.amount,
                })),
            });
            const modeAmounts = [
                { amount: plan.cash, method: account_transaction_enum_1.PaymentMethod.Cash },
                { amount: plan.card, method: account_transaction_enum_1.PaymentMethod.Card },
                { amount: plan.upi, method: account_transaction_enum_1.PaymentMethod.UPI },
            ];
            for (const mode of modeAmounts) {
                await this.recordPurchasePayment({
                    amount: mode.amount,
                    description: `Purchase Payment to ${supplier.name} (${mode.method})`,
                    paymentMethod: mode.method,
                });
            }
            return payment;
        }
        catch (error) {
            for (const update of [...applied].reverse()) {
                await this.purchaseEntryModel.updateOne({ _id: update.id, paidAmount: update.paidAmount }, {
                    $set: {
                        paidAmount: update.previousPaidAmount,
                        paymentStatus: update.previousPaymentStatus,
                    },
                });
            }
            throw error;
        }
    }
    async listSupplierPayments(supplierId, query) {
        await this.requireSupplier(supplierId);
        const page = Math.max(1, Number(query?.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(query?.limit) || exports.SUPPLIER_PAYMENT_PAGE_SIZE));
        const filter = { supplier: supplierId };
        const total = await this.supplierPaymentModel.countDocuments(filter).exec();
        const payments = await this.supplierPaymentModel
            .find(filter)
            .sort({ date: -1, _id: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select('date cash card upi total allocations')
            .exec();
        return {
            payments,
            total,
            page,
            limit,
            totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        };
    }
    async requireSupplier(supplierId) {
        if (!mongoose_2.default.isValidObjectId(supplierId)) {
            throw new common_1.BadRequestException('Invalid supplier');
        }
        const supplier = await this.supplierModel.findById(supplierId).exec();
        if (!supplier || supplier.isDeleted) {
            throw new common_1.NotFoundException('Supplier not found');
        }
        return supplier;
    }
};
exports.PurchaseEntryService = PurchaseEntryService;
exports.PurchaseEntryService = PurchaseEntryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(purchase_entry_schema_1.PurchaseEntry.name)),
    __param(2, (0, mongoose_1.InjectModel)(supplier_schema_1.Supplier.name)),
    __param(3, (0, mongoose_1.InjectModel)(supplier_payment_schema_1.SupplierPayment.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        items_service_1.ItemsService,
        mongoose_2.Model,
        mongoose_2.Model,
        accounts_service_1.AccountsService])
], PurchaseEntryService);
//# sourceMappingURL=purchase_entry.service.js.map