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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const billing_schema_1 = require("./schemas/billing.schema");
const mongoose_2 = __importStar(require("mongoose"));
const billingItem_schema_1 = require("./schemas/billingItem.schema");
const users_service_1 = require("../users/users.service");
const order_schema_1 = require("../pharmacy/orders/schemas/order.schema");
const accounts_service_1 = require("../accounts/accounts.service");
const session_doctor_1 = require("./session-doctor");
const account_transaction_enum_1 = require("../accounts/enums/account-transaction.enum");
const ledger_group_1 = require("../accounts/ledger-group");
const configuration_1 = __importDefault(require("../config/configuration"));
const sale_line_1 = require("../pharmacy/sale-line");
const pharmacy_receipt_1 = require("./pharmacy-receipt");
let BillingService = class BillingService {
    billingModel;
    billingItemModel;
    orderModel;
    usersService;
    accountsService;
    constructor(billingModel, billingItemModel, orderModel, usersService, accountsService) {
        this.billingModel = billingModel;
        this.billingItemModel = billingItemModel;
        this.orderModel = orderModel;
        this.usersService = usersService;
        this.accountsService = accountsService;
    }
    normalizeDoctorValue(value) {
        if (value === undefined ||
            value === null ||
            value === '' ||
            value === 'Self' ||
            value === 'self' ||
            value === '-') {
            return null;
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed || trimmed === 'Self' || trimmed === 'self' || trimmed === '-') {
                return null;
            }
            return mongoose_2.default.isValidObjectId(trimmed)
                ? new mongoose_2.default.Types.ObjectId(trimmed)
                : null;
        }
        if (value instanceof mongoose_2.default.Types.ObjectId) {
            return value;
        }
        return null;
    }
    async determineSourceModule(userId) {
        if (!userId || !mongoose_2.default.isValidObjectId(userId)) {
            return account_transaction_enum_1.SourceModule.Pharmacy;
        }
        const uIdStr = userId.toString();
        const config = (0, configuration_1.default)();
        if (config.in_house_lab_id &&
            uIdStr === config.in_house_lab_id.toString()) {
            return account_transaction_enum_1.SourceModule.Lab;
        }
        if (config.in_house_pharmacy_id &&
            uIdStr === config.in_house_pharmacy_id.toString()) {
            return account_transaction_enum_1.SourceModule.Pharmacy;
        }
        if (config.in_house_reception_id &&
            uIdStr === config.in_house_reception_id.toString()) {
            return account_transaction_enum_1.SourceModule.Reception;
        }
        try {
            const user = await this.usersService.getUserById(userId);
            if (!user || !user.role) {
                return account_transaction_enum_1.SourceModule.Pharmacy;
            }
            const role = String(user.role).toLowerCase();
            if (role.includes('doctor'))
                return account_transaction_enum_1.SourceModule.Doctor;
            if (role.includes('pharmacy') || role.includes('pharmacist'))
                return account_transaction_enum_1.SourceModule.Pharmacy;
            if (role.includes('lab') || role.includes('technician'))
                return account_transaction_enum_1.SourceModule.Lab;
            if (role.includes('reception') || role.includes('receptionist'))
                return account_transaction_enum_1.SourceModule.Reception;
            return account_transaction_enum_1.SourceModule.Pharmacy;
        }
        catch {
            return account_transaction_enum_1.SourceModule.Pharmacy;
        }
    }
    async generateUniqueMRN(prefix) {
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
            const match = lastRecord.mrn.match(new RegExp(`^${prefixWithHyphen}(\\d+)$`));
            if (match && match[1]) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }
        let mrn;
        let exists = true;
        do {
            mrn = `${prefixWithHyphen}${nextNumber.toString().padStart(5, '0')}`;
            const existing = await this.billingModel.exists({ mrn });
            exists = !!existing;
            if (exists)
                nextNumber++;
        } while (exists);
        return mrn;
    }
    async generateBill(createBill) {
        createBill.doctor = this.normalizeDoctorValue(createBill.doctor);
        if (!createBill.salesMRN &&
            (createBill.transactionType === 'Refund' ||
                createBill.transactionType === 'Return')) {
            createBill.salesMRN = String(createBill.note || '').match(/\bInvoice\s+([A-Z0-9-]+)/i)?.[1];
        }
        const sourceBill = createBill.salesMRN
            ? await this.billingModel.findOne({ mrn: createBill.salesMRN }).lean()
            : null;
        if (sourceBill) {
            const sourceSession = await this.billingModel.db
                .collection('treatments')
                .findOne({ bill: sourceBill._id, isDeleted: { $ne: true } });
            const inheritedTherapist = String(sourceBill.therapistName || sourceSession?.therapistName || '').trim();
            createBill.billingCategory =
                sourceBill.billingCategory ||
                    (inheritedTherapist ? 'Procedure' : createBill.billingCategory);
            createBill.therapistName = inheritedTherapist;
        }
        if (!createBill.billingCategory) {
            const isSessionBill = /^\s*(therapy|procedure)\s+session\s+#\s*\d+\s*$/i.test(String(createBill.note || ''));
            if (createBill.therapistName || isSessionBill) {
                createBill.billingCategory = 'Procedure';
            }
            else {
                const sourceModule = await this.determineSourceModule(createBill.user);
                createBill.billingCategory =
                    sourceModule === account_transaction_enum_1.SourceModule.Reception
                        ? 'Reception'
                        : sourceModule === account_transaction_enum_1.SourceModule.Lab
                            ? 'Other'
                            : 'Pharmacy';
            }
        }
        const prefix = await this.usersService.getPharmacyBillingPrefix(createBill.user);
        createBill.mrn = await this.generateUniqueMRN(prefix);
        const itemsTotal = (createBill.items ?? []).reduce((sum, item) => sum + (item.total ?? (item.quantity ?? 1) * (item.unitPrice ?? 0)), 0);
        const totalPaid = (createBill.cash ?? 0) +
            (createBill.card ?? 0) +
            (createBill.upi ?? 0) +
            (createBill.discount ?? 0);
        if (!createBill.status) {
            createBill.status = totalPaid >= itemsTotal ? 'Completed' : 'Draft';
        }
        const data = await this.billingModel.create(createBill);
        if (createBill.rxId) {
            const order = await this.orderModel
                .findOne({ mrn: createBill.rxId })
                .populate('items.name');
            if (order) {
                order.billNo = data.mrn;
                order.cash = createBill.cash ?? 0;
                order.card = createBill.card ?? 0;
                order.upi = createBill.upi ?? 0;
                if (createBill.discount !== undefined) {
                    order.discount = createBill.discount ?? 0;
                }
                const paidAmount = (createBill.cash ?? 0) +
                    (createBill.card ?? 0) +
                    (createBill.upi ?? 0) +
                    (createBill.discount ?? 0);
                const getOrderItemPrice = (it) => (0, sale_line_1.resolveSaleLine)({
                    name: it.name,
                    quantity: it.quantity,
                    unitPrice: it.unitPrice,
                    gst: it.gst,
                    batchNumber: it.batchNumber,
                    expiryDate: it.expiryDate,
                    item: it.name,
                }).unitPrice;
                const orderTotal = order.items.reduce((total, it) => total + (it.quantity || 1) * getOrderItemPrice(it), 0);
                order.paidAmount = paidAmount >= orderTotal ? orderTotal : paidAmount;
                if (paidAmount === 0) {
                    order.paymentStatus = order_schema_1.PaymentStatus.Pending;
                }
                else if (paidAmount < orderTotal) {
                    order.paymentStatus = order_schema_1.PaymentStatus.Partial;
                }
                else {
                    order.paymentStatus = order_schema_1.PaymentStatus.Paid;
                }
                const accountant = String(order.pharmacist || '').trim();
                if (accountant && accountant !== '-') {
                    data.inCharge = accountant;
                    await data.save();
                }
                await order.save();
            }
        }
        try {
            const sourceModule = await this.determineSourceModule(createBill.user);
            const isRefund = createBill.transactionType === 'Refund' ||
                (createBill.items &&
                    createBill.items.some((i) => String(i.name || '')
                        .toLowerCase()
                        .includes('refund')));
            const isReturn = createBill.transactionType === 'Return';
            const ncfPayment = (0, ledger_group_1.isSeparateNcfPayment)(createBill);
            const isExpense = ncfPayment || isRefund || isReturn;
            const type = isExpense ? account_transaction_enum_1.TransactionType.Expense : account_transaction_enum_1.TransactionType.Income;
            const isTherapy = String(createBill.note || '')
                .toLowerCase()
                .includes('therapy') ||
                (createBill.items &&
                    createBill.items.some((i) => String(i.name || '')
                        .toLowerCase()
                        .includes('therapy')));
            const isProcedure = String(createBill.note || '')
                .toLowerCase()
                .includes('procedure') ||
                (createBill.items &&
                    createBill.items.some((i) => String(i.name || '')
                        .toLowerCase()
                        .includes('procedure')));
            const isTherapyOrProcedure = isTherapy ||
                isProcedure ||
                this.isTherapyOrProcedureBill(createBill);
            let category;
            if (ncfPayment) {
                category = account_transaction_enum_1.ExpenseCategory.Refund;
            }
            else if (isRefund) {
                category = isTherapyOrProcedure
                    ? account_transaction_enum_1.ExpenseCategory.TherapyRefund
                    : account_transaction_enum_1.ExpenseCategory.Refund;
            }
            else if (isReturn) {
                category = account_transaction_enum_1.ExpenseCategory.SalesReturn;
            }
            else if (isTherapy) {
                category = account_transaction_enum_1.IncomeCategory.TherapyIncome;
            }
            else if (isProcedure) {
                category = account_transaction_enum_1.IncomeCategory.ProcedureIncome;
            }
            else if (sourceModule === account_transaction_enum_1.SourceModule.Doctor) {
                category = account_transaction_enum_1.IncomeCategory.ConsultationFee;
            }
            else if (sourceModule === account_transaction_enum_1.SourceModule.Lab) {
                category = account_transaction_enum_1.IncomeCategory.LaboratoryIncome;
            }
            else if (sourceModule === account_transaction_enum_1.SourceModule.Reception) {
                category = account_transaction_enum_1.IncomeCategory.ConsultationFee;
            }
            else {
                category = account_transaction_enum_1.IncomeCategory.MedicineSale;
            }
            let paymentMethod = account_transaction_enum_1.PaymentMethod.Cash;
            if ((createBill.card ?? 0) > (createBill.cash ?? 0) &&
                (createBill.card ?? 0) > (createBill.upi ?? 0)) {
                paymentMethod = account_transaction_enum_1.PaymentMethod.Card;
            }
            else if ((createBill.upi ?? 0) > (createBill.cash ?? 0) &&
                (createBill.upi ?? 0) > (createBill.card ?? 0)) {
                paymentMethod = account_transaction_enum_1.PaymentMethod.UPI;
            }
            const billAmount = isExpense
                ? itemsTotal > 0
                    ? itemsTotal
                    : totalPaid > 0
                        ? totalPaid
                        : Math.abs((createBill.cash ?? 0) +
                            (createBill.card ?? 0) +
                            (createBill.upi ?? 0))
                : totalPaid;
            if (billAmount > 0) {
                await this.accountsService.recordTransaction({
                    type,
                    category,
                    amount: billAmount,
                    description: `${sourceModule} ${ncfPayment ? 'NCF' : isRefund ? 'Refund' : isReturn ? 'Return' : 'Bill'} #${data.mrn}`,
                    paymentMethod,
                    sourceModule,
                    ...(ncfPayment
                        ? { ledgerGroup: ledger_group_1.TallyLedgerGroup.Reception, notes: 'NCF' }
                        : {}),
                    costCentre: (0, ledger_group_1.therapyCostCentre)(createBill.therapistName, category),
                    createdBy: createBill.user,
                    transactionDate: new Date(),
                });
            }
        }
        catch (err) {
            console.error('Error auto recording account transaction from bill:', err);
        }
        return data;
    }
    treatmentBillClauses() {
        return [
            { billingCategory: 'Procedure' },
            { note: /^\s*(therapy|procedure)\s+session\s+#\s*\d+\s*$/i },
            { therapistName: { $exists: true, $nin: ['', '-'] } },
            {
                transactionType: 'Refund',
                note: /\b(therapy|procedure)\s+package\s+refund\s+for\s+invoice\b/i,
            },
        ];
    }
    receptionFeeClauses() {
        return [
            { note: /consultation|reception|registration|ncf|refund/i },
            {
                'items.name': /consultation|registration|ncf|refund|fee|opd|doctor|token/i,
            },
            {
                $expr: {
                    $eq: [{ $size: { $ifNull: ['$items', []] } }, 0],
                },
            },
        ];
    }
    isTherapyOrProcedureBill(bill) {
        return (bill.billingCategory === 'Procedure' ||
            !!String(bill.therapistName || '').trim() ||
            /^\s*(therapy|procedure)\s+session\s+#\s*\d+\s*$/i.test(String(bill.note || '')));
    }
    async getBills(user, getBillisDto) {
        const { page = 1, limit = 10, q, qEnd, method, status, startDate, endDate, date, activeDate, userRole, billType, patientVisitor, sort, } = getBillisDto;
        const skip = (page - 1) * limit;
        const pipeline = [];
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
        const match = {};
        const qEndFound = qEnd
            ? await this.billingModel.exists({ mrn: qEnd.toUpperCase() })
            : false;
        if (q && qEnd && qEndFound) {
            match.mrn = { $gte: q.toUpperCase(), $lte: qEnd.toUpperCase() };
        }
        else if (q && q.trim()) {
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
        }
        else if (startDate || endDate) {
            const dateFilter = {};
            if (startDate)
                dateFilter.$gte = new Date(startDate);
            if (endDate)
                dateFilter.$lte = new Date(endDate);
            match.createdAt = dateFilter;
        }
        if (method) {
            if (method === 'Cash') {
                match.cash = { $ne: 0 };
            }
            else if (method === 'UPI') {
                match.upi = { $ne: 0 };
            }
            else if (method === 'Card') {
                match.card = { $ne: 0 };
            }
        }
        if (billType && billType !== 'all') {
            const receptionRegex = /consultation|registration|ncf|refund|fee|opd|doctor|token|reception/i;
            if (billType === 'therapy' || billType === 'procedure' || billType === 'treatment') {
                const clauses = this.treatmentBillClauses();
                if (match.$or) {
                    match.$and = [...(match.$and || []), { $or: clauses }];
                }
                else {
                    match.$or = clauses;
                }
            }
            else if (billType === 'pharmacy') {
                match.$nor = [
                    ...(match.$nor || []),
                    ...this.treatmentBillClauses(),
                    { billingCategory: 'Reception' },
                    ...this.receptionFeeClauses(),
                ];
            }
            else if (billType === 'counter') {
                match.$and = [
                    ...(match.$and || []),
                    {
                        $or: [
                            ...this.treatmentBillClauses(),
                            { $nor: this.receptionFeeClauses() },
                        ],
                    },
                ];
            }
            else if (billType === 'reception') {
                match.$or = [
                    { transactionType: { $in: ['Refund', 'Return'] } },
                    { note: receptionRegex },
                    { 'items.name': receptionRegex },
                ];
            }
            else if (billType === 'other') {
                match.$nor = [
                    ...this.treatmentBillClauses(),
                    { note: receptionRegex },
                    { 'items.name': receptionRegex },
                    { transactionType: { $in: ['Refund', 'Return'] } },
                ];
            }
        }
        pipeline.push({ $match: match });
        if (patientVisitor === 'new' || patientVisitor === 'existing') {
            pipeline.push({
                $lookup: {
                    from: 'billings',
                    let: {
                        pid: '$patient._id',
                        billDate: '$createdAt',
                        billId: '$_id',
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$patient', '$$pid'] },
                                        { $eq: ['$transactionType', 'Sale'] },
                                        { $ne: ['$_id', '$$billId'] },
                                        { $lt: ['$createdAt', '$$billDate'] },
                                    ],
                                },
                            },
                        },
                        { $limit: 1 },
                        { $project: { _id: 1 } },
                    ],
                    as: 'priorSales',
                },
            });
            pipeline.push({
                $addFields: {
                    priorSaleCount: { $size: '$priorSales' },
                },
            });
            if (patientVisitor === 'new') {
                pipeline.push({ $match: { priorSaleCount: 0 } });
            }
            else {
                pipeline.push({ $match: { priorSaleCount: { $gt: 0 } } });
            }
            pipeline.push({ $project: { priorSales: 0, priorSaleCount: 0 } });
        }
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
        const requester = user ? await this.usersService.getUserById(user) : null;
        const requesterRole = String(requester?.role || '').toLowerCase();
        const pharmacyListing = /^pharmacy$/i.test(userRole || '') || requesterRole.includes('pharmacy');
        if (userRole && /^reception$/i.test(userRole)) {
            pipeline.push({
                $match: {
                    'creator.role': new RegExp(`^${userRole}$`, 'i'),
                    $nor: this.treatmentBillClauses(),
                },
            });
        }
        else if (pharmacyListing) {
            const pharmacyScope = [];
            if (user) {
                pharmacyScope.unshift({ user: new mongoose_2.default.Types.ObjectId(user) });
            }
            if (userRole && /^pharmacy$/i.test(userRole)) {
                pharmacyScope.unshift({ 'creator.role': /^pharmacy$/i });
            }
            pipeline.push({ $match: { $or: pharmacyScope } });
        }
        else if (userRole) {
            pipeline.push({
                $match: { 'creator.role': new RegExp(`^${userRole}$`, 'i') },
            });
        }
        else if (user) {
            pipeline.push({
                $match: { user: new mongoose_2.default.Types.ObjectId(user) },
            });
        }
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
            }
            else if (status === 'Paid') {
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
            }
            else if (status === 'Partial') {
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
                    {
                        $sort: sort === 'asc'
                            ? { createdAt: 1, mrn: 1 }
                            : { createdAt: -1, mrn: -1 },
                    },
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
        for (const bill of data) {
            const normalizedDoctor = this.normalizeDoctorValue(bill.doctor);
            if (normalizedDoctor) {
                const doc = await this.usersService.getUserById(normalizedDoctor);
                if (doc) {
                    bill.doctor = doc;
                }
            }
            if (!normalizedDoctor) {
                bill.doctor = null;
            }
        }
        await this.attachSessionTherapists(data);
        await this.enrichBillingCategories(data);
        await this.repairZeroPricedBills(data);
        return { data, total };
    }
    async attachSessionTherapists(bills) {
        if (!bills?.length)
            return;
        const ids = bills.map((bill) => bill._id).filter(Boolean);
        let sessions = [];
        try {
            sessions = await this.billingModel.db
                .collection('treatments')
                .find({ bill: { $in: ids }, isDeleted: { $ne: true } })
                .project({ bill: 1, therapistName: 1, doctor: 1, doctorName: 1 })
                .toArray();
        }
        catch {
            sessions = [];
        }
        const therapists = new Map();
        const visits = new Map();
        for (const session of sessions) {
            if (!session.bill)
                continue;
            const key = String(session.bill);
            const therapist = String(session.therapistName || '').trim();
            if (therapist && therapist !== '-')
                therapists.set(key, therapist);
            const picked = (0, session_doctor_1.pickVisitDoctor)(session);
            const current = visits.get(key);
            visits.set(key, {
                id: picked.id || current?.id || null,
                name: picked.name || current?.name || '',
            });
        }
        for (const bill of bills) {
            const key = String(bill._id);
            const stored = String(bill.therapistName || '').trim();
            const linked = therapists.get(key) || '';
            const name = stored && stored !== '-' ? stored : linked;
            bill.therapistName = name && name !== '-' ? name : '';
            if ((0, session_doctor_1.displayDoctorName)(bill.doctor))
                continue;
            const visit = visits.get(key);
            if (!visit || (!visit.id && !visit.name))
                continue;
            if (visit.id) {
                try {
                    const doc = await this.usersService.getUserById(visit.id);
                    if (doc && (0, session_doctor_1.displayDoctorName)(doc)) {
                        bill.doctor = doc;
                        await this.storeVisitDoctor(bill._id, doc._id || visit.id);
                        continue;
                    }
                }
                catch (error) {
                    console.error('Failed to look up visit doctor:', error);
                }
            }
            if (visit.name) {
                bill.doctor = { name: visit.name };
            }
        }
    }
    async enrichBillingCategories(bills) {
        if (!bills?.length)
            return;
        const refundSourceMrns = new Map();
        for (const bill of bills) {
            if (!['Refund', 'Return'].includes(bill.transactionType))
                continue;
            const sourceMrn = String(bill.salesMRN || '').trim() ||
                String(bill.note || '').match(/\bInvoice\s+([A-Z0-9-]+)/i)?.[1] ||
                '';
            if (sourceMrn)
                refundSourceMrns.set(String(bill._id), sourceMrn);
        }
        const sourceMrns = [...new Set(refundSourceMrns.values())];
        const sourceBills = sourceMrns.length
            ? await this.billingModel.find({ mrn: { $in: sourceMrns } }).lean()
            : [];
        await this.attachSessionTherapists(sourceBills);
        const sourceByMrn = new Map();
        for (const source of sourceBills) {
            if (!source.billingCategory) {
                if (this.isTherapyOrProcedureBill(source)) {
                    source.billingCategory = 'Procedure';
                }
                else {
                    const module = await this.determineSourceModule(source.user);
                    source.billingCategory =
                        module === account_transaction_enum_1.SourceModule.Reception
                            ? 'Reception'
                            : module === account_transaction_enum_1.SourceModule.Lab
                                ? 'Other'
                                : 'Pharmacy';
                }
            }
            sourceByMrn.set(source.mrn, source);
        }
        for (const bill of bills) {
            if (!bill.billingCategory) {
                const sourceMrn = refundSourceMrns.get(String(bill._id));
                const source = sourceMrn ? sourceByMrn.get(sourceMrn) : null;
                if (source) {
                    bill.salesMRN = source.mrn;
                    bill.billingCategory = source.billingCategory;
                    bill.therapistName = source.therapistName || '';
                }
                else if (this.isTherapyOrProcedureBill(bill)) {
                    bill.billingCategory = 'Procedure';
                }
                else {
                    const module = await this.determineSourceModule(bill.user);
                    bill.billingCategory =
                        module === account_transaction_enum_1.SourceModule.Reception
                            ? 'Reception'
                            : module === account_transaction_enum_1.SourceModule.Lab
                                ? 'Other'
                                : 'Pharmacy';
                }
            }
        }
    }
    async storeVisitDoctor(billId, doctorId) {
        if (!billId || !doctorId || typeof this.billingModel.updateOne !== 'function') {
            return;
        }
        try {
            await this.billingModel.updateOne({
                _id: billId,
                $or: [{ doctor: null }, { doctor: { $exists: false } }],
            }, { $set: { doctor: doctorId } });
        }
        catch (error) {
            console.error('Failed to store visit doctor on bill:', error);
        }
    }
    async repairZeroPricedBills(bills) {
        const candidates = (bills || []).filter((bill) => Array.isArray(bill?.items) &&
            bill.items.length > 0 &&
            bill.items.every((item) => !(Number(item?.unitPrice) > 0) && !(Number(item?.total) > 0)));
        if (!candidates.length)
            return;
        const mrns = candidates.map((bill) => bill.mrn).filter(Boolean);
        if (!mrns.length)
            return;
        const orders = await this.orderModel
            .find({ billNo: { $in: mrns } })
            .populate('items.name')
            .lean();
        const byBill = new Map(orders.map((order) => [order.billNo, order]));
        for (const bill of candidates) {
            const order = byBill.get(bill.mrn);
            if (!order)
                continue;
            let changed = false;
            const items = bill.items.map((line, index) => {
                const orderItem = (order.items || []).find((it) => {
                    const itemName = it?.name && typeof it.name === 'object' ? it.name.name : '';
                    return (itemName &&
                        itemName.toLowerCase() === String(line?.name || '').toLowerCase());
                }) || order.items?.[index];
                if (!orderItem)
                    return line;
                const itemDoc = orderItem.name && typeof orderItem.name === 'object'
                    ? orderItem.name
                    : undefined;
                const resolved = (0, sale_line_1.resolveSaleLine)({
                    name: line.name || itemDoc?.name,
                    quantity: line.quantity || orderItem.quantity,
                    unitPrice: line.unitPrice || orderItem.unitPrice,
                    gst: line.gst || orderItem.gst,
                    batchNumber: line.batchNumber || orderItem.batchNumber,
                    expiryDate: line.expiryDate || orderItem.expiryDate,
                    item: itemDoc,
                });
                if (!(resolved.unitPrice > 0))
                    return line;
                changed = true;
                return {
                    ...line,
                    name: line.name || resolved.name,
                    quantity: resolved.quantity,
                    unitPrice: resolved.unitPrice,
                    gst: resolved.gst || Number(line.gst) || 0,
                    total: resolved.total,
                    batchNumber: resolved.batchNumber,
                    expiryDate: resolved.expiryDate,
                    generic: line.generic || resolved.generic,
                };
            });
            if (!changed)
                continue;
            bill.items = items;
            if (bill._id) {
                await this.billingModel.updateOne({ _id: bill._id }, { $set: { items } });
            }
        }
    }
    async getBill(id) {
        if (!mongoose_2.default.isValidObjectId(id))
            throw new common_1.BadRequestException('Please provide a valid bill id');
        const data = await this.billingModel
            .findById(id)
            .populate('patient')
            .populate('items')
            .lean()
            .exec();
        if (!data)
            throw new common_1.NotFoundException('Bill is not found.');
        const normalizedDoctor = this.normalizeDoctorValue(data.doctor);
        if (normalizedDoctor) {
            const doc = await this.usersService.getUserById(normalizedDoctor);
            if (doc) {
                data.doctor = doc;
            }
        }
        if (!normalizedDoctor) {
            data.doctor = null;
        }
        await this.repairZeroPricedBills([data]);
        return data;
    }
    async getBillByReportId(reportId) {
        if (!mongoose_2.default.isValidObjectId(reportId))
            throw new common_1.BadRequestException('Please provide a valid report id');
        const data = await this.billingModel
            .findOne({ reportId })
            .populate('patient')
            .populate('items')
            .lean()
            .exec();
        if (!data)
            throw new common_1.NotFoundException('Bill is not found.');
        const normalizedDoctor = this.normalizeDoctorValue(data.doctor);
        if (normalizedDoctor) {
            const doc = await this.usersService.getUserById(normalizedDoctor);
            if (doc) {
                data.doctor = doc;
            }
        }
        if (!normalizedDoctor) {
            data.doctor = null;
        }
        return data;
    }
    async updateBill(id, updateBillDto) {
        if (!mongoose_2.default.isValidObjectId(id))
            throw new common_1.BadRequestException('Please provide a valid bill id');
        const existingBill = await this.billingModel.findById(id);
        if (!existingBill)
            throw new common_1.NotFoundException('Bill is not found.');
        if (existingBill.status === 'Completed') {
            throw new common_1.BadRequestException('Cannot edit a completed bill');
        }
        const data = await this.billingModel.findByIdAndUpdate(id, { $set: updateBillDto }, { new: true });
        return data;
    }
    async updateBillStatusByReportId(reportId, status) {
        if (!mongoose_2.default.isValidObjectId(reportId))
            throw new common_1.BadRequestException('Please provide a valid report id');
        const data = await this.billingModel.findOneAndUpdate({ reportId }, { $set: { status } }, { new: true });
        return data;
    }
    async addBillingItem(addBillingItemDto, user) {
        const isExist = await this.billingItemModel.exists({
            user,
            code: addBillingItemDto.code,
        });
        if (isExist) {
            throw new common_1.BadRequestException('Item code already exists in billing items.');
        }
        const data = await this.billingItemModel.create({
            user,
            ...addBillingItemDto,
        });
        return data;
    }
    async updateBillingItem(id, updateBillingItemDto, user) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException('Invalid billing item ID');
        }
        if (updateBillingItemDto.code) {
            const isExist = await this.billingItemModel.exists({
                user,
                code: updateBillingItemDto.code,
                _id: { $ne: id },
            });
            if (isExist) {
                throw new common_1.BadRequestException('Item code already exists in billing.');
            }
        }
        const data = await this.billingItemModel.findOneAndUpdate({ _id: id, user }, updateBillingItemDto, { new: true });
        if (!data) {
            throw new common_1.NotFoundException('Billing item not found');
        }
        return data;
    }
    async getBillingItems({ item }, user) {
        const filter = { user };
        if (item) {
            filter.$or = [
                { item: new RegExp(`^${item}`, 'i') },
                { code: new RegExp(`^${item}`, 'i') },
            ];
        }
        return this.billingItemModel.find(filter).lean().exec();
    }
    async deleteBillingItem(item, user) {
        const data = await this.billingItemModel.findOneAndDelete({ user, item });
        return data;
    }
    async addPayment(id, addPaymentDto, user) {
        const data = await this.billingModel.findOneAndUpdate({ _id: id }, {
            $set: {
                cash: addPaymentDto.cash,
                upi: addPaymentDto.upi,
                card: addPaymentDto.card,
                ...(addPaymentDto.discount !== undefined
                    ? { discount: addPaymentDto.discount }
                    : {}),
            },
        }, { new: true });
        if (!data)
            throw new common_1.NotFoundException('Bill is not found.');
        const totalNewPaid = (addPaymentDto.cash ?? 0) +
            (addPaymentDto.card ?? 0) +
            (addPaymentDto.upi ?? 0);
        if (totalNewPaid > 0) {
            try {
                const sourceModule = await this.determineSourceModule(user || data.user);
                const isRefund = data.transactionType === 'Refund' ||
                    (data.items &&
                        data.items.some((i) => String(i.name || '')
                            .toLowerCase()
                            .includes('refund')));
                const isReturn = data.transactionType === 'Return';
                const ncfPayment = (0, ledger_group_1.isSeparateNcfPayment)(data);
                const isExpense = ncfPayment || isRefund || isReturn;
                const type = isExpense
                    ? account_transaction_enum_1.TransactionType.Expense
                    : account_transaction_enum_1.TransactionType.Income;
                const isTherapy = String(data.note || '')
                    .toLowerCase()
                    .includes('therapy') ||
                    (data.items &&
                        data.items.some((i) => String(i.name || '')
                            .toLowerCase()
                            .includes('therapy')));
                const isProcedure = String(data.note || '')
                    .toLowerCase()
                    .includes('procedure') ||
                    (data.items &&
                        data.items.some((i) => String(i.name || '')
                            .toLowerCase()
                            .includes('procedure')));
                const isTherapyOrProcedure = isTherapy || isProcedure || this.isTherapyOrProcedureBill(data);
                let category;
                if (ncfPayment) {
                    category = account_transaction_enum_1.ExpenseCategory.Refund;
                }
                else if (isRefund) {
                    category = isTherapyOrProcedure
                        ? account_transaction_enum_1.ExpenseCategory.TherapyRefund
                        : account_transaction_enum_1.ExpenseCategory.Refund;
                }
                else if (isReturn) {
                    category = account_transaction_enum_1.ExpenseCategory.SalesReturn;
                }
                else if (isTherapy) {
                    category = account_transaction_enum_1.IncomeCategory.TherapyIncome;
                }
                else if (isProcedure) {
                    category = account_transaction_enum_1.IncomeCategory.ProcedureIncome;
                }
                else if (sourceModule === account_transaction_enum_1.SourceModule.Doctor) {
                    category = account_transaction_enum_1.IncomeCategory.ConsultationFee;
                }
                else if (sourceModule === account_transaction_enum_1.SourceModule.Lab) {
                    category = account_transaction_enum_1.IncomeCategory.LaboratoryIncome;
                }
                else if (sourceModule === account_transaction_enum_1.SourceModule.Reception) {
                    category = account_transaction_enum_1.IncomeCategory.ConsultationFee;
                }
                else {
                    category = account_transaction_enum_1.IncomeCategory.MedicineSale;
                }
                let paymentMethod = account_transaction_enum_1.PaymentMethod.Cash;
                if ((addPaymentDto.card ?? 0) > (addPaymentDto.cash ?? 0) &&
                    (addPaymentDto.card ?? 0) > (addPaymentDto.upi ?? 0)) {
                    paymentMethod = account_transaction_enum_1.PaymentMethod.Card;
                }
                else if ((addPaymentDto.upi ?? 0) > (addPaymentDto.cash ?? 0) &&
                    (addPaymentDto.upi ?? 0) > (addPaymentDto.card ?? 0)) {
                    paymentMethod = account_transaction_enum_1.PaymentMethod.UPI;
                }
                await this.accountsService.recordTransaction({
                    type,
                    category,
                    amount: totalNewPaid,
                    description: `${sourceModule} ${ncfPayment ? 'NCF' : isRefund ? 'Refund' : isReturn ? 'Return' : 'Payment'} for Bill #${data.mrn}`,
                    paymentMethod,
                    sourceModule,
                    ...(ncfPayment
                        ? { ledgerGroup: ledger_group_1.TallyLedgerGroup.Reception, notes: 'NCF' }
                        : {}),
                    costCentre: (0, ledger_group_1.therapyCostCentre)(data.therapistName, category),
                    createdBy: user || data.user,
                    transactionDate: new Date(),
                });
            }
            catch (err) {
                console.error('Error recording account transaction in addPayment:', err);
            }
        }
        return data;
    }
    async markAsPaid(id, markAsPaidDto) {
        const existingBill = await this.billingModel.findById(id);
        if (!existingBill)
            throw new common_1.NotFoundException('Bill is not found.');
        const inputCash = Math.max(0, Number(markAsPaidDto.cash) || 0);
        const inputCard = Math.max(0, Number(markAsPaidDto.card) || 0);
        const inputUpi = Math.max(0, Number(markAsPaidDto.upi) || 0);
        const inputDiscount = Math.max(0, Number(markAsPaidDto.discount) || 0);
        const replace = markAsPaidDto.replace === true;
        const currentCash = existingBill.cash || 0;
        const currentCard = existingBill.card || 0;
        const currentUpi = existingBill.upi || 0;
        const currentDiscount = existingBill.discount || 0;
        const newCash = replace ? inputCash : currentCash + inputCash;
        const newCard = replace ? inputCard : currentCard + inputCard;
        const newUpi = replace ? inputUpi : currentUpi + inputUpi;
        const newDiscount = replace ? inputDiscount : currentDiscount + inputDiscount;
        const deltaCash = newCash - currentCash;
        const deltaCard = newCard - currentCard;
        const deltaUpi = newUpi - currentUpi;
        const totalPaid = newCash + newCard + newUpi + newDiscount;
        const itemsTotal = (existingBill.items || []).reduce((a, b) => a + (b.total ?? 0), 0);
        const roundOffAmount = existingBill.roundOff ? itemsTotal % 1 : 0;
        const netTotal = itemsTotal - roundOffAmount;
        if (totalPaid > netTotal + 0.01) {
            throw new common_1.BadRequestException('Payment split cannot exceed the bill total.');
        }
        const updateObj = replace
            ? {
                $set: {
                    cash: newCash,
                    card: newCard,
                    upi: newUpi,
                    discount: newDiscount,
                },
            }
            : {
                $inc: {
                    cash: inputCash,
                    card: inputCard,
                    upi: inputUpi,
                    discount: inputDiscount,
                },
            };
        if (totalPaid >= netTotal - 0.01) {
            updateObj.$set = { ...(updateObj.$set || {}), status: 'Completed' };
        }
        const data = await this.billingModel.findOneAndUpdate({ _id: id }, updateObj, { new: true });
        if (!data)
            throw new common_1.NotFoundException('Bill is not found.');
        const hasMethodChange = Math.abs(deltaCash) > 0.001 ||
            Math.abs(deltaCard) > 0.001 ||
            Math.abs(deltaUpi) > 0.001;
        if (hasMethodChange) {
            try {
                const sourceModule = await this.determineSourceModule(data.user);
                const isRefund = data.transactionType === 'Refund' ||
                    (data.items &&
                        data.items.some((i) => String(i.name || '')
                            .toLowerCase()
                            .includes('refund')));
                const isReturn = data.transactionType === 'Return';
                const ncfPayment = (0, ledger_group_1.isSeparateNcfPayment)(data);
                const isExpense = ncfPayment || isRefund || isReturn;
                const type = isExpense
                    ? account_transaction_enum_1.TransactionType.Expense
                    : account_transaction_enum_1.TransactionType.Income;
                const isTherapy = String(data.note || '')
                    .toLowerCase()
                    .includes('therapy') ||
                    (data.items &&
                        data.items.some((i) => String(i.name || '')
                            .toLowerCase()
                            .includes('therapy')));
                const isProcedure = String(data.note || '')
                    .toLowerCase()
                    .includes('procedure') ||
                    (data.items &&
                        data.items.some((i) => String(i.name || '')
                            .toLowerCase()
                            .includes('procedure')));
                const isTherapyOrProcedure = isTherapy || isProcedure || this.isTherapyOrProcedureBill(data);
                let category;
                if (ncfPayment) {
                    category = account_transaction_enum_1.ExpenseCategory.Refund;
                }
                else if (isRefund) {
                    category = isTherapyOrProcedure
                        ? account_transaction_enum_1.ExpenseCategory.TherapyRefund
                        : account_transaction_enum_1.ExpenseCategory.Refund;
                }
                else if (isReturn) {
                    category = account_transaction_enum_1.ExpenseCategory.SalesReturn;
                }
                else if (isTherapy) {
                    category = account_transaction_enum_1.IncomeCategory.TherapyIncome;
                }
                else if (isProcedure) {
                    category = account_transaction_enum_1.IncomeCategory.ProcedureIncome;
                }
                else if (sourceModule === account_transaction_enum_1.SourceModule.Doctor) {
                    category = account_transaction_enum_1.IncomeCategory.ConsultationFee;
                }
                else if (sourceModule === account_transaction_enum_1.SourceModule.Lab) {
                    category = account_transaction_enum_1.IncomeCategory.LaboratoryIncome;
                }
                else if (sourceModule === account_transaction_enum_1.SourceModule.Reception) {
                    category = account_transaction_enum_1.IncomeCategory.ConsultationFee;
                }
                else {
                    category = account_transaction_enum_1.IncomeCategory.MedicineSale;
                }
                const ledgerGroup = (0, ledger_group_1.ledgerGroupForCategory)(category);
                const reverseType = isExpense
                    ? account_transaction_enum_1.TransactionType.Income
                    : account_transaction_enum_1.TransactionType.Expense;
                const correctionCategory = isExpense
                    ? account_transaction_enum_1.IncomeCategory.PaymentCorrection
                    : account_transaction_enum_1.ExpenseCategory.PaymentCorrection;
                const reverseCorrectionCategory = isExpense
                    ? account_transaction_enum_1.ExpenseCategory.PaymentCorrection
                    : account_transaction_enum_1.IncomeCategory.PaymentCorrection;
                const paymentLabel = ncfPayment
                    ? 'NCF'
                    : isRefund
                        ? 'Refund'
                        : isReturn
                            ? 'Return'
                            : 'Payment';
                const deltas = [
                    { amount: deltaCash, method: account_transaction_enum_1.PaymentMethod.Cash },
                    { amount: deltaCard, method: account_transaction_enum_1.PaymentMethod.Card },
                    { amount: deltaUpi, method: account_transaction_enum_1.PaymentMethod.UPI },
                ];
                let swapToReassign = 0;
                for (const d of deltas) {
                    if (d.amount < -0.001) {
                        const amount = Math.abs(d.amount);
                        swapToReassign += amount;
                        await this.accountsService.recordTransaction({
                            type: reverseType,
                            category: correctionCategory,
                            amount,
                            description: `${sourceModule} payment method correction for Bill #${data.mrn} (${d.method} reduced)`,
                            paymentMethod: d.method,
                            sourceModule,
                            ledgerGroup,
                            costCentre: (0, ledger_group_1.therapyCostCentre)(data.therapistName, category, ledgerGroup),
                            createdBy: data.user,
                            transactionDate: new Date(),
                        });
                    }
                }
                for (const d of deltas) {
                    if (d.amount <= 0.001)
                        continue;
                    const reassigned = Math.min(swapToReassign, d.amount);
                    swapToReassign -= reassigned;
                    const fresh = d.amount - reassigned;
                    if (reassigned > 0.001) {
                        await this.accountsService.recordTransaction({
                            type,
                            category: reverseCorrectionCategory,
                            amount: reassigned,
                            description: `${sourceModule} payment method correction for Bill #${data.mrn} (${d.method} increased)`,
                            paymentMethod: d.method,
                            sourceModule,
                            ledgerGroup,
                            costCentre: (0, ledger_group_1.therapyCostCentre)(data.therapistName, category, ledgerGroup),
                            createdBy: data.user,
                            transactionDate: new Date(),
                        });
                    }
                    if (fresh > 0.001) {
                        await this.accountsService.recordTransaction({
                            type,
                            category,
                            amount: fresh,
                            description: `${sourceModule} ${paymentLabel} for Bill #${data.mrn} (${d.method})`,
                            paymentMethod: d.method,
                            sourceModule,
                            ledgerGroup,
                            costCentre: (0, ledger_group_1.therapyCostCentre)(data.therapistName, category, ledgerGroup),
                            ...(ncfPayment ? { notes: 'NCF' } : {}),
                            createdBy: data.user,
                            transactionDate: new Date(),
                        });
                    }
                }
            }
            catch (err) {
                console.error('Error recording account transaction in markAsPaid:', err);
            }
        }
        return data;
    }
    async getBillDropDown(getBillDropDownDto) {
        const { query = '' } = getBillDropDownDto;
        const safeQuery = String(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const data = await this.billingModel
            .find({ mrn: new RegExp(safeQuery, 'i'), transactionType: 'Sale' })
            .limit(10)
            .select('user patient mrn')
            .populate('patient', 'name phoneNumber gender dateOfBirth mrn address')
            .lean()
            .exec();
        return data;
    }
    async getSingleCustomerBill(q, role) {
        let data = await this.billingModel
            .find({ patient: q })
            .populate('patient', 'name phoneNumber gender dateOfBirth mrn address')
            .populate('user', 'name role email')
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        if (role) {
            data = data.filter((bill) => {
                const userRole = (bill.user?.role || '').toLowerCase();
                if (role.toLowerCase() === 'pharmacy') {
                    if (this.isTherapyOrProcedureBill(bill))
                        return true;
                    if (userRole.includes('pharmacy'))
                        return true;
                    if (userRole === 'doctor' || userRole === 'lab' || userRole === 'reception')
                        return false;
                    if (bill.reportId || bill.tokenNumber || bill.token)
                        return false;
                    const noteStr = String(bill.note || '').toLowerCase();
                    if (/consultation|registration|token|ncf/i.test(noteStr))
                        return false;
                    const items = bill.items || [];
                    if (items.length === 0)
                        return false;
                    return items.some((it) => {
                        const n = String(typeof it.name === 'string' ? it.name : it.name?.name || '').toLowerCase();
                        return !/consultation|registration|token|ncf|lab|blood|scan|x-ray|ecg/i.test(n);
                    });
                }
                if (role.toLowerCase() === 'reception' && this.isTherapyOrProcedureBill(bill)) {
                    return false;
                }
                return new RegExp(`^${role}$`, 'i').test(userRole);
            });
        }
        for (const bill of data) {
            if (bill.doctor && mongoose_2.default.isValidObjectId(bill.doctor)) {
                const doc = await this.usersService.getUserById(bill.doctor);
                if (doc) {
                    bill.doctor = doc;
                }
            }
        }
        await this.repairZeroPricedBills(data);
        return data;
    }
    validateAndConvertDoctorString(doctorString) {
        if (!doctorString || typeof doctorString !== 'string') {
            return {
                valid: false,
                objectId: null,
                message: 'Doctor string is required and must be a string',
            };
        }
        const trimmed = doctorString.trim();
        if (!trimmed || trimmed === 'Self' || trimmed === 'self' || trimmed === '-') {
            return {
                valid: true,
                objectId: null,
                message: 'Doctor string represents "Self" or empty - converted to null (no specific doctor)',
            };
        }
        if (!mongoose_2.default.isValidObjectId(trimmed)) {
            return {
                valid: false,
                objectId: null,
                message: `"${trimmed}" is not a valid MongoDB ObjectId`,
            };
        }
        const objectId = new mongoose_2.default.Types.ObjectId(trimmed).toString();
        return {
            valid: true,
            objectId,
            message: `Successfully converted "${trimmed}" to ObjectId: ${objectId}`,
        };
    }
    async recordPharmacySaleReceipt(bill, options) {
        try {
            const mrn = String(bill?.mrn || '').trim();
            if (!mrn)
                return;
            const already = await this.accountsService.sumMedicineSaleReceipts(mrn);
            const lines = (0, pharmacy_receipt_1.pharmacySaleReceipts)(bill, already);
            const parsed = bill.createdAt ? new Date(bill.createdAt) : new Date();
            const transactionDate = Number.isNaN(parsed.getTime())
                ? new Date()
                : parsed;
            for (const line of lines) {
                await this.accountsService.recordTransaction({
                    type: account_transaction_enum_1.TransactionType.Income,
                    category: account_transaction_enum_1.IncomeCategory.MedicineSale,
                    amount: line.amount,
                    description: `Pharmacy Bill #${mrn} (${line.method})`,
                    paymentMethod: line.method,
                    sourceModule: account_transaction_enum_1.SourceModule.Pharmacy,
                    ledgerGroup: ledger_group_1.TallyLedgerGroup.Pharmacy,
                    createdBy: bill.user ?? undefined,
                    transactionDate,
                    ...(options?.deferTally ? { deferTally: true } : {}),
                });
            }
        }
        catch (err) {
            console.error('Error recording pharmacy sale receipt:', err);
        }
    }
    async backfillPaidPharmacyReceipts() {
        const bills = await this.billingModel
            .find({
            billingCategory: 'Pharmacy',
            transactionType: { $nin: ['Refund', 'Return'] },
            $or: [{ cash: { $gt: 0 } }, { card: { $gt: 0 } }, { upi: { $gt: 0 } }],
        })
            .select('mrn billingCategory transactionType cash card upi user createdAt')
            .lean();
        for (const bill of bills) {
            await this.recordPharmacySaleReceipt(bill, { deferTally: true });
        }
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(billing_schema_1.Billing.name)),
    __param(1, (0, mongoose_1.InjectModel)(billingItem_schema_1.BillingItem.name)),
    __param(2, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        users_service_1.UsersService,
        accounts_service_1.AccountsService])
], BillingService);
//# sourceMappingURL=billing.service.js.map