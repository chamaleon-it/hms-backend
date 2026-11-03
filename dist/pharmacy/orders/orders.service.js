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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const order_schema_1 = require("./schemas/order.schema");
const mongoose_2 = __importStar(require("mongoose"));
const items_service_1 = require("../items/items.service");
const billing_service_1 = require("../../billing/billing.service");
const users_service_1 = require("../../users/users.service");
const configuration_1 = __importDefault(require("../../config/configuration"));
const patient_schema_1 = require("../../patients/schemas/patient.schema");
const billing_schema_1 = require("../../billing/schemas/billing.schema");
const sale_line_1 = require("../sale-line");
let OrdersService = class OrdersService {
    orderModel;
    patientModel;
    billingModel;
    itemsService;
    billingService;
    usersService;
    constructor(orderModel, patientModel, billingModel, itemsService, billingService, usersService) {
        this.orderModel = orderModel;
        this.patientModel = patientModel;
        this.billingModel = billingModel;
        this.itemsService = itemsService;
        this.billingService = billingService;
        this.usersService = usersService;
    }
    isOutsideItem(item) {
        if (!item)
            return false;
        if (item.isCustom === true)
            return true;
        const raw = item.name;
        const id = raw && typeof raw === 'object' ? raw._id : raw;
        if (id && mongoose_2.default.isValidObjectId(String(id)))
            return false;
        return Boolean(String(item.referralName || '').trim());
    }
    toBillItem(item, itemData) {
        const resolved = (0, sale_line_1.resolveSaleLine)({
            name: itemData?.name,
            quantity: item?.quantity,
            unitPrice: item?.unitPrice,
            gst: item?.gst,
            batchNumber: item?.batchNumber,
            expiryDate: item?.expiryDate,
            item: itemData,
        });
        return {
            name: resolved.name,
            quantity: resolved.quantity,
            unitPrice: resolved.unitPrice,
            gst: resolved.gst,
            discount: 0,
            total: resolved.total,
            batchNumber: resolved.batchNumber,
            expiryDate: resolved.expiryDate,
            generic: resolved.generic,
        };
    }
    async syncBillFromOrder(orderId) {
        const order = await this.orderModel
            .findById(orderId)
            .populate('items.name')
            .exec();
        if (!order)
            return;
        const items = (order.items || [])
            .filter((item) => !this.isOutsideItem(item))
            .map((item) => {
            const itemDoc = item.name && typeof item.name === 'object' ? item.name : undefined;
            return this.toBillItem(item, itemDoc);
        });
        const subtotal = (0, sale_line_1.roundMoney)((order.items || []).reduce((sum, item) => {
            if (this.isOutsideItem(item))
                return sum;
            const catalog = item.name && typeof item.name === 'object' ? item.name : undefined;
            const batch = (0, sale_line_1.lineSaleBatch)(catalog?.batches, item.batchNumber, item.quantity);
            const unit = (batch ? (0, sale_line_1.batchSalePrice)(batch) : 0) || (0, sale_line_1.positiveMoney)(item.unitPrice);
            return sum + unit * (Number(item.quantity) || 0);
        }, 0));
        const discount = (0, sale_line_1.clampOrderDiscount)(order.discount, subtotal);
        const payable = (0, sale_line_1.roundMoney)(subtotal - discount);
        const legacyCash = (0, sale_line_1.splitTotal)(order) === 0 && (0, sale_line_1.positiveMoney)(order.paidAmount) > 0
            ? order.paidAmount
            : order.cash;
        const split = (0, sale_line_1.clampPaymentSplit)({ ...order.toObject(), cash: legacyCash }, payable);
        const paidAmount = (0, sale_line_1.splitTotal)(split);
        const paymentStatus = paidAmount <= 0
            ? order_schema_1.PaymentStatus.Pending
            : paidAmount + 0.009 < payable
                ? order_schema_1.PaymentStatus.Partial
                : order_schema_1.PaymentStatus.Paid;
        const orderPatch = {};
        if (Number(order.discount) !== discount)
            orderPatch.discount = discount;
        if (Number(order.cash) !== split.cash)
            orderPatch.cash = split.cash;
        if (Number(order.card) !== split.card)
            orderPatch.card = split.card;
        if (Number(order.upi) !== split.upi)
            orderPatch.upi = split.upi;
        if (Number(order.paidAmount) !== paidAmount)
            orderPatch.paidAmount = paidAmount;
        if (order.paymentStatus !== paymentStatus)
            orderPatch.paymentStatus = paymentStatus;
        if (Object.keys(orderPatch).length) {
            await this.orderModel.updateOne({ _id: order._id }, { $set: orderPatch });
        }
        if (!order.billNo || order.billNo === '-')
            return;
        const bill = await this.billingModel.findOne({ mrn: order.billNo });
        if (!bill)
            return;
        if (items.some((line) => line.unitPrice > 0)) {
            bill.items = items;
        }
        bill.discount = discount;
        bill.cash = split.cash;
        bill.card = split.card;
        bill.upi = split.upi;
        bill.status = paidAmount + 0.009 >= payable ? 'Completed' : 'Draft';
        await bill.save();
        await this.billingService.recordPharmacySaleReceipt(bill);
    }
    async generateUniqueMRN() {
        const prefix = 'ORD-';
        const lastRecord = await this.orderModel
            .findOne({ mrn: { $regex: `^${prefix}\\d+$` } })
            .collation({ locale: 'en_US', numericOrdering: true })
            .sort({ mrn: -1 })
            .select('mrn')
            .lean()
            .exec();
        let nextNumber = 1;
        if (lastRecord && lastRecord.mrn) {
            const match = lastRecord.mrn.match(new RegExp(`^${prefix}(\\d+)$`));
            if (match && match[1]) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }
        let mrn;
        let exists = true;
        do {
            mrn = `${prefix}${nextNumber.toString().padStart(5, '0')}`;
            const existing = await this.orderModel.exists({ mrn });
            exists = !!existing;
            if (exists)
                nextNumber++;
        } while (exists);
        return mrn;
    }
    async createOrder(order) {
        const mrn = await this.generateUniqueMRN();
        order.mrn = mrn;
        const data = await this.orderModel.create(order);
        const { autoGenerateBill } = await this.usersService.getPharmacyBilling((0, configuration_1.default)().in_house_pharmacy_id);
        if (autoGenerateBill) {
            const billable = (order.items || []).filter((item) => !this.isOutsideItem(item) && item.name);
            if (billable.length) {
                const items = await Promise.all(billable.map(async (item) => {
                    if (!item.name)
                        return this.toBillItem(item, undefined);
                    const itemData = await this.itemsService.getItem(item.name);
                    return this.toBillItem(item, itemData);
                }));
                const bill = await this.billingService.generateBill({
                    patient: order.patient,
                    items,
                    user: new mongoose_2.default.Types.ObjectId((0, configuration_1.default)().in_house_pharmacy_id),
                    discount: order.discount ?? 0,
                    doctor: order.doctor ?? null,
                    inCharge: order.pharmacist,
                });
                data.billNo = bill.mrn;
            }
            if (order.allergies) {
                await this.patientModel.findByIdAndUpdate(order.patient, {
                    allergies: order.allergies,
                });
            }
            if (billable.length || order.allergies) {
                await data.save();
            }
        }
        return data;
    }
    async getOrders(query) {
        const { page = 1, limit = 20, q } = query;
        const skip = (page - 1) * limit;
        const filter = {};
        if (query.startDate && query.endDate) {
            filter.createdAt = {
                $gte: query.startDate,
                $lte: query.endDate,
            };
        }
        filter.isDeleted = false;
        if (q === order_schema_1.OrderStatus.Pending) {
            filter.status = order_schema_1.OrderStatus.Pending;
        }
        else if (q === order_schema_1.OrderStatus.Completed) {
            filter.status = order_schema_1.OrderStatus.Completed;
        }
        else if (q === 'Deleted') {
            filter.isDeleted = true;
        }
        const [data, total] = await Promise.all([
            this.orderModel
                .find(filter)
                .sort({ createdAt: 1, mrn: 1 })
                .skip(skip)
                .limit(limit)
                .populate('patient')
                .populate('doctor', 'name phoneNumber specialization')
                .populate('items.name')
                .exec(),
            this.orderModel.countDocuments(filter),
        ]);
        return { data, total };
    }
    async deleteOrder(id) {
        if (!mongoose_2.default.isValidObjectId(id))
            throw new common_1.BadRequestException('Order id is not valid. Please check your order id.');
        const data = await this.orderModel
            .findByIdAndUpdate(id, {
            isDeleted: true,
        }, { new: true, runValidators: true })
            .lean();
        if (!data) {
            throw new common_1.BadRequestException('Sorry, the order doesn’t exist. Please check your order details.');
        }
        return data;
    }
    async getSingleOrder(q) {
        const safe = String(q || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = { $regex: '^' + safe, $options: 'i' };
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
            throw new common_1.NotFoundException('Order not found.');
        }
        const bill = data.billNo && data.billNo !== '-'
            ? await this.billingModel
                .findOne({ mrn: data.billNo })
                .select('cash card upi')
                .lean()
            : null;
        return {
            ...data,
            cash: bill?.cash ?? data.cash ?? 0,
            card: bill?.card ?? data.card ?? 0,
            upi: bill?.upi ?? data.upi ?? 0,
        };
    }
    async getCustomers(query) {
        const { page = 1, limit = 10, alreadyPurchase = 'true', q, query: queryParam, gender, doctor, lastVisit, from, to, age, minAge, maxAge, address, city, district, state, pincode, } = query;
        const skip = (page - 1) * limit;
        const searchTerm = (q || queryParam || '').trim();
        let minA;
        let maxA;
        if (age && typeof age === 'string') {
            const [m1, m2] = age.split('-').map(Number);
            if (!isNaN(m1))
                minA = m1;
            if (!isNaN(m2))
                maxA = m2;
        }
        if (minAge !== undefined && minAge !== '') {
            const parsed = Number(minAge);
            if (!isNaN(parsed))
                minA = parsed;
        }
        if (maxAge !== undefined && maxAge !== '') {
            const parsed = Number(maxAge);
            if (!isNaN(parsed))
                maxA = parsed;
        }
        const patientFilter = { status: { $ne: patient_schema_1.PatientStatus.DELETED } };
        if (searchTerm) {
            const searchRegex = { $regex: searchTerm, $options: 'i' };
            const orConditions = [
                { name: searchRegex },
                { phoneNumber: searchRegex },
                { mrn: searchRegex },
            ];
            if (mongoose_2.default.isValidObjectId(searchTerm)) {
                orConditions.push({ _id: new mongoose_2.default.Types.ObjectId(searchTerm) });
            }
            patientFilter.$or = orConditions;
        }
        if (gender) {
            patientFilter.gender = gender;
        }
        if (address) {
            const addressSearchTerm = address.trim();
            patientFilter.$and = patientFilter.$and || [];
            patientFilter.$and.push({
                $or: [
                    { addressLine1: { $regex: addressSearchTerm, $options: 'i' } },
                    { addressLine2: { $regex: addressSearchTerm, $options: 'i' } },
                    { address: { $regex: addressSearchTerm, $options: 'i' } },
                ],
            });
        }
        if (city) {
            patientFilter.city = { $regex: city.trim(), $options: 'i' };
        }
        if (district) {
            patientFilter.district = { $regex: district.trim(), $options: 'i' };
        }
        if (state) {
            patientFilter.state = { $regex: state.trim(), $options: 'i' };
        }
        if (pincode) {
            patientFilter.pinCode = { $regex: pincode.trim(), $options: 'i' };
        }
        if (doctor && alreadyPurchase === 'false') {
            patientFilter.doctor = new mongoose_2.default.Types.ObjectId(doctor);
        }
        if (minA !== undefined &&
            maxA !== undefined &&
            !isNaN(minA) &&
            !isNaN(maxA)) {
            if (minA > 0 || maxA < 100) {
                const now = new Date();
                const minDate = new Date(now.getFullYear() - maxA - 1, now.getMonth(), now.getDate() + 1);
                const maxDate = new Date(now.getFullYear() - minA, now.getMonth(), now.getDate(), 23, 59, 59, 999);
                patientFilter.$expr = {
                    $and: [
                        {
                            $gte: [
                                {
                                    $convert: {
                                        input: '$dateOfBirth',
                                        to: 'date',
                                        onError: null,
                                        onNull: null,
                                    },
                                },
                                minDate,
                            ],
                        },
                        {
                            $lte: [
                                {
                                    $convert: {
                                        input: '$dateOfBirth',
                                        to: 'date',
                                        onError: null,
                                        onNull: null,
                                    },
                                },
                                maxDate,
                            ],
                        },
                    ],
                };
            }
        }
        const billingMatch = {
            patient: { $exists: true, $ne: null },
            transactionType: 'Sale',
        };
        if (lastVisit) {
            const now = new Date();
            if (lastVisit === '7') {
                const dateLimit = new Date(now.setDate(now.getDate() - 7));
                billingMatch.createdAt = { $gte: dateLimit };
            }
            else if (lastVisit === '30') {
                const dateLimit = new Date(now.setDate(now.getDate() - 30));
                billingMatch.createdAt = { $gte: dateLimit };
            }
            else if (lastVisit === 'Custom' && (from || to)) {
                const dateMatch = {};
                if (from)
                    dateMatch.$gte = new Date(from);
                if (to) {
                    const toDate = new Date(to);
                    toDate.setHours(23, 59, 59, 999);
                    dateMatch.$lte = toDate;
                }
                billingMatch.createdAt = dateMatch;
            }
        }
        if (alreadyPurchase === 'false' && lastVisit) {
            const purchasedPatientIds = await this.billingModel.distinct('patient', billingMatch);
            patientFilter._id = { $in: purchasedPatientIds };
        }
        let patientIds = null;
        let total = 0;
        if (alreadyPurchase === 'true') {
            const aggregationPipeline = [
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
                { $match: { 'patientDetail.status': { $ne: patient_schema_1.PatientStatus.DELETED } } },
            ];
            if (doctor) {
                aggregationPipeline.push({
                    $match: {
                        'patientDetail.doctor': new mongoose_2.default.Types.ObjectId(doctor),
                    },
                });
            }
            if (searchTerm) {
                const searchRegex = { $regex: searchTerm, $options: 'i' };
                const orConditions = [
                    { 'patientDetail.name': searchRegex },
                    { 'patientDetail.phoneNumber': searchRegex },
                    { 'patientDetail.mrn': searchRegex },
                ];
                if (mongoose_2.default.isValidObjectId(searchTerm)) {
                    orConditions.push({
                        'patientDetail._id': new mongoose_2.default.Types.ObjectId(searchTerm),
                    });
                }
                aggregationPipeline.push({
                    $match: { $or: orConditions },
                });
            }
            if (gender) {
                aggregationPipeline.push({
                    $match: { 'patientDetail.gender': gender },
                });
            }
            if (address) {
                const addressSearchTerm = address.trim();
                aggregationPipeline.push({
                    $match: {
                        $or: [
                            {
                                'patientDetail.addressLine1': {
                                    $regex: addressSearchTerm,
                                    $options: 'i',
                                },
                            },
                            {
                                'patientDetail.addressLine2': {
                                    $regex: addressSearchTerm,
                                    $options: 'i',
                                },
                            },
                            {
                                'patientDetail.address': {
                                    $regex: addressSearchTerm,
                                    $options: 'i',
                                },
                            },
                        ],
                    },
                });
            }
            if (city) {
                aggregationPipeline.push({
                    $match: {
                        'patientDetail.city': { $regex: city.trim(), $options: 'i' },
                    },
                });
            }
            if (district) {
                aggregationPipeline.push({
                    $match: {
                        'patientDetail.district': {
                            $regex: district.trim(),
                            $options: 'i',
                        },
                    },
                });
            }
            if (state) {
                aggregationPipeline.push({
                    $match: {
                        'patientDetail.state': { $regex: state.trim(), $options: 'i' },
                    },
                });
            }
            if (pincode) {
                aggregationPipeline.push({
                    $match: {
                        'patientDetail.pinCode': { $regex: pincode.trim(), $options: 'i' },
                    },
                });
            }
            if (minA !== undefined &&
                maxA !== undefined &&
                !isNaN(minA) &&
                !isNaN(maxA)) {
                if (minA > 0 || maxA < 100) {
                    const now = new Date();
                    const minDate = new Date(now.getFullYear() - maxA - 1, now.getMonth(), now.getDate() + 1);
                    const maxDate = new Date(now.getFullYear() - minA, now.getMonth(), now.getDate(), 23, 59, 59, 999);
                    aggregationPipeline.push({
                        $match: {
                            $expr: {
                                $and: [
                                    {
                                        $gte: [
                                            {
                                                $convert: {
                                                    input: '$patientDetail.dateOfBirth',
                                                    to: 'date',
                                                    onError: null,
                                                    onNull: null,
                                                },
                                            },
                                            minDate,
                                        ],
                                    },
                                    {
                                        $lte: [
                                            {
                                                $convert: {
                                                    input: '$patientDetail.dateOfBirth',
                                                    to: 'date',
                                                    onError: null,
                                                    onNull: null,
                                                },
                                            },
                                            maxDate,
                                        ],
                                    },
                                ],
                            },
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
        }
        else {
            total = await this.patientModel.countDocuments(patientFilter);
        }
        let patients = [];
        if (alreadyPurchase === 'true') {
            if (patientIds && patientIds.length > 0) {
                const patientsUnordered = await this.patientModel
                    .find({ _id: { $in: patientIds } })
                    .lean()
                    .exec();
                const patientMap = new Map(patientsUnordered.map((p) => [p._id.toString(), p]));
                patients = patientIds
                    .map((id) => patientMap.get(id.toString()))
                    .filter((p) => !!p);
            }
            else {
                return { data: [], total: 0 };
            }
        }
        else {
            patients = await this.patientModel
                .find(patientFilter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec();
        }
        const isPharmacyBill = (b) => {
            const userRole = (b.user?.role || '').toLowerCase();
            if (userRole.includes('pharmacy'))
                return true;
            if (userRole === 'doctor' || userRole === 'lab' || userRole === 'reception')
                return false;
            if (b.reportId || b.tokenNumber || b.token)
                return false;
            const noteStr = String(b.note || '').toLowerCase();
            if (/consultation|registration|token|ncf|therapy|procedure/i.test(noteStr))
                return false;
            const items = b.items || [];
            if (items.length === 0)
                return false;
            return items.some((it) => {
                const n = String(typeof it.name === 'string' ? it.name : it.name?.name || '').toLowerCase();
                return !/consultation|registration|token|ncf|therapy|procedure|lab|blood|scan|x-ray|ecg/i.test(n);
            });
        };
        const bills = (await this.billingModel
            .find({
            patient: { $in: patients.map((e) => e._id) },
        })
            .populate('user', 'role')
            .lean()
            .exec()).filter(isPharmacyBill);
        const data = patients.map((e) => {
            const patientBills = bills.filter((i) => i.patient.toString() === e._id.toString() &&
                i.transactionType === 'Sale');
            patientBills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const totalSpend = patientBills.reduce((a, b) => a + (b.items?.reduce((c, d) => c + (d.total || 0), 0) || 0), 0);
            return {
                totalSpend,
                visits: patientBills.length,
                patient: e,
                lastPurchase: patientBills[0]?.createdAt ?? null,
            };
        });
        return { data, total };
    }
    async getCustomer(patientId) {
        const isPharmacyBill = (b) => {
            const userRole = (b.user?.role || '').toLowerCase();
            if (userRole.includes('pharmacy'))
                return true;
            if (userRole === 'doctor' || userRole === 'lab' || userRole === 'reception')
                return false;
            if (b.reportId || b.tokenNumber || b.token)
                return false;
            const noteStr = String(b.note || '').toLowerCase();
            if (/consultation|registration|token|ncf|therapy|procedure/i.test(noteStr))
                return false;
            const items = b.items || [];
            if (items.length === 0)
                return false;
            return items.some((it) => {
                const n = String(typeof it.name === 'string' ? it.name : it.name?.name || '').toLowerCase();
                return !/consultation|registration|token|ncf|therapy|procedure|lab|blood|scan|x-ray|ecg/i.test(n);
            });
        };
        const [sampleBill, rawBills] = await Promise.all([
            this.billingModel
                .findOne({ patient: patientId })
                .populate('patient')
                .select('patient')
                .lean()
                .exec(),
            this.billingModel
                .find({ patient: patientId })
                .populate('user', 'role')
                .sort({ createdAt: -1 })
                .lean()
                .exec(),
        ]);
        const bills = rawBills.filter(isPharmacyBill);
        const patient = sampleBill?.patient ?? null;
        if (!patient) {
            throw new common_1.NotFoundException('This patient has not purchased any items.');
        }
        const salesOnly = bills.filter((b) => b.transactionType === 'Sale');
        const totalVisit = salesOnly.length;
        const totalSpend = salesOnly.reduce((acc, bill) => {
            const billTotal = (bill.items || []).reduce((itemAcc, item) => itemAcc + (item.total || 0), 0);
            return acc + billTotal - (bill.discount || 0);
        }, 0);
        const averageSpend = totalVisit > 0 ? totalSpend / totalVisit : 0;
        const lastPurchase = salesOnly[0]?.createdAt ?? null;
        const totalPaid = bills.reduce((acc, bill) => {
            return acc + (bill.cash ?? 0) + (bill.card ?? 0) + (bill.upi ?? 0);
        }, 0);
        const itemsTotal = salesOnly.reduce((acc, bill) => acc +
            (bill.items || []).reduce((iAcc, i) => iAcc + (i.total || 0), 0) -
            (bill.discount || 0), 0);
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
    async getOrdersByPatient(patientId) {
        const data = await this.orderModel
            .find({ patient: patientId, isDeleted: false })
            .populate('patient')
            .populate('doctor', 'name phoneNumber specialization')
            .populate('items.name')
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return data;
    }
    async updateOrder(dto) {
        const $set = {};
        const fields = [
            'mrn',
            'patient',
            'doctor',
            'doctorName',
            'pharmacist',
            'discount',
            'cash',
            'card',
            'upi',
            'paidAmount',
            'paymentStatus',
            'billNo',
            'priority',
            'status',
            'assignedTo',
            'advice',
        ];
        for (const key of fields) {
            if (dto[key] !== undefined)
                $set[key] = dto[key];
        }
        if (dto.items) {
            $set.items = dto.items.map((item) => {
                const rawName = item.name;
                const name = rawName && typeof rawName === 'object' && '_id' in rawName
                    ? rawName._id
                    : rawName;
                const outside = this.isOutsideItem({ ...item, name });
                const inventoryName = !outside && name && mongoose_2.default.isValidObjectId(String(name))
                    ? name
                    : undefined;
                const batchNumber = (0, sale_line_1.isPlaceholderBatchNumber)(item.batchNumber)
                    ? undefined
                    : String(item.batchNumber).trim();
                return {
                    name: inventoryName,
                    isCustom: outside,
                    referralName: outside
                        ? String(item.referralName || '').trim()
                        : item.referralName,
                    dosage: item.dosage,
                    frequency: item.frequency,
                    food: item.food,
                    duration: item.duration,
                    quantity: item.quantity,
                    batchNumber: outside ? undefined : batchNumber,
                    unitPrice: outside ? 0 : item.unitPrice,
                    mrp: outside ? 0 : item.mrp,
                    gst: outside ? 0 : item.gst,
                    purchasePrice: outside ? 0 : item.purchasePrice,
                    expiryDate: outside || !item.expiryDate ? undefined : new Date(item.expiryDate),
                };
            });
        }
        const order = await this.orderModel
            .findByIdAndUpdate(dto._id, { $set }, { new: true, runValidators: true })
            .lean();
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        await this.syncBillFromOrder(order._id);
        return order;
    }
    async completeOrder(id, userId) {
        const order = await this.orderModel.findById(id).populate('patient').exec();
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.status !== order_schema_1.OrderStatus.Completed) {
            const userObjId = userId
                ? new mongoose_2.default.Types.ObjectId(userId)
                : new mongoose_2.default.Types.ObjectId((0, configuration_1.default)().in_house_pharmacy_id);
            const deductions = [];
            for (const item of order.items) {
                if (this.isOutsideItem(item))
                    continue;
                if (!item.name || !(item.quantity > 0))
                    continue;
                const itemId = (item.name?._id ||
                    item.name);
                const itemDoc = await this.itemsService.getItem(itemId);
                const batch = (0, sale_line_1.lineSaleBatch)(itemDoc?.batches, item.batchNumber, item.quantity);
                const stockBatchNumber = (0, sale_line_1.rawBatchNumber)(batch);
                if (!batch || !stockBatchNumber) {
                    throw new common_1.BadRequestException(`No in-stock batch available for ${itemDoc?.name || 'this medicine'}.`);
                }
                const batchNumber = (0, sale_line_1.readBatchNumber)(batch) || stockBatchNumber;
                const price = (0, sale_line_1.batchSalePrice)(batch);
                item.batchNumber = batchNumber;
                if (price > 0)
                    item.unitPrice = price;
                if (!(Number(item.gst) > 0) && Number(batch.gst) > 0) {
                    item.gst = Number(batch.gst);
                }
                if (batch.expiryDate)
                    item.expiryDate = batch.expiryDate;
                deductions.push({
                    itemId,
                    quantity: item.quantity,
                    batchNumber,
                });
            }
            const patientObj = order.patient;
            for (const line of deductions) {
                await this.itemsService.decreaseItem(line.itemId, line.quantity, userObjId, patientObj?.name || order.customerName, patientObj?.phoneNumber ||
                    order.customerPhone ||
                    patientObj?.phone, order.doctorName || order.doctor, order.pharmacistName || order.pharmacist, patientObj?.mrn || order.mrn, line.batchNumber);
            }
            order.status = order_schema_1.OrderStatus.Completed;
            await order.save();
        }
        await this.syncBillFromOrder(order._id);
        return order;
    }
    async repeatOrder(id) {
        const bill = await this.billingModel.findById(id).lean().exec();
        const existOrder = await this.orderModel
            .findOne({ billNo: bill?.mrn })
            .lean()
            .exec();
        if (!existOrder) {
            throw new common_1.NotFoundException('Order not found');
        }
        const newOrder = {};
        const mrn = await this.generateUniqueMRN();
        newOrder.mrn = mrn;
        newOrder.patient = existOrder.patient;
        newOrder.doctor = existOrder.doctor;
        newOrder.doctorName = existOrder.doctorName;
        newOrder.items = (existOrder.items || [])
            .filter((item) => {
            const nameStr = String(item.name || '').toLowerCase().trim();
            const nonMedicineKeywords = [
                'consultation', 'consulting', 'doctor fee', 'opd', 'ipd', 'registration', 'token', 'ncf',
                'lab', 'laboratory', 'investigation', 'test', 'blood', 'ecg', 'x-ray', 'xray', 'ct scan',
                'mri', 'scan', 'ultrasound', 'usg', 'therapy', 'therapies', 'procedure', 'procedures',
                'procedural', 'treatment', 'fasad', 'agni karma', 'agnikarma', 'steam bath', 'swedana',
                'swedanam', 'kizhi', 'elakizhi', 'podikizhi', 'njavarakizhi', 'abhyangam', 'abhyanga',
                'shirodhara', 'takradhara', 'ksheeradhara', 'dhara', 'vasti', 'basti', 'kativasti',
                'januvasti', 'greevavasti', 'matravasti', 'nasya', 'nasyam', 'raktamokshana',
                'udvarthanam', 'udvartana', 'pizhichil', 'thalam', 'talam', 'lepanam', 'lepa',
                'tarpanam', 'tarpana', 'pichu', 'karna poorana', 'karnapooranam', 'acupuncture',
                'panchakarma', 'cupping', 'hijama', 'moxibustion', 'varmam', 'varma', 'physio',
                'physiotherapy', 'massage', 'refund', 'return',
            ];
            return !nonMedicineKeywords.some((kw) => nameStr.includes(kw));
        })
            .map((item) => {
            return {
                ...item,
            };
        });
        newOrder.priority = existOrder.priority;
        newOrder.discount = existOrder.discount;
        newOrder.assignedTo = existOrder.assignedTo;
        newOrder.advice = existOrder.advice;
        const data = await this.orderModel.create(newOrder);
        const billable = (data.items || []).filter((item) => !this.isOutsideItem(item) && item.name);
        if (billable.length) {
            const items = await Promise.all(billable.map(async (item) => {
                if (!item.name)
                    return this.toBillItem(item, undefined);
                const itemData = await this.itemsService.getItem(item.name);
                return this.toBillItem(item, itemData);
            }));
            await this.billingService.generateBill({
                patient: data.patient,
                items,
                user: new mongoose_2.default.Types.ObjectId((0, configuration_1.default)().in_house_pharmacy_id),
                discount: data.discount ?? 0,
                doctor: data.doctor ?? null,
                inCharge: existOrder.pharmacist,
            });
        }
        return data;
    }
    async updatePayment(dto) {
        const data = await this.orderModel
            .findByIdAndUpdate(dto.orderId, dto, { new: true, runValidators: true })
            .populate('patient')
            .populate('doctor', 'name phoneNumber specialization')
            .populate('items.name')
            .lean();
        const paidBill = data?.billNo
            ? await this.billingModel
                .findOneAndUpdate({ mrn: data.billNo }, { cash: data.paidAmount }, { new: true, runValidators: true })
                .lean()
            : null;
        if (!data) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (paidBill) {
            await this.billingService.recordPharmacySaleReceipt(paidBill);
        }
        return data;
    }
    async recoverOrder(id) {
        const data = await this.orderModel
            .findByIdAndUpdate(id, { isDeleted: false }, { new: true, runValidators: true })
            .lean();
        if (!data) {
            throw new common_1.NotFoundException('Order not found');
        }
        return data;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __param(1, (0, mongoose_1.InjectModel)(patient_schema_1.Patient.name)),
    __param(2, (0, mongoose_1.InjectModel)(billing_schema_1.Billing.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        items_service_1.ItemsService,
        billing_service_1.BillingService,
        users_service_1.UsersService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map