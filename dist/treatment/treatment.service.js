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
exports.TreatmentService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importStar(require("mongoose"));
const treatment_schema_1 = require("./schemas/treatment.schema");
const employee_schema_1 = require("../employee/schemas/employee.schema");
const billing_service_1 = require("../billing/billing.service");
const configuration_1 = __importDefault(require("../config/configuration"));
let TreatmentService = class TreatmentService {
    treatmentModel;
    employeeModel;
    billingService;
    constructor(treatmentModel, employeeModel, billingService) {
        this.treatmentModel = treatmentModel;
        this.employeeModel = employeeModel;
        this.billingService = billingService;
    }
    async generateUniqueMRN() {
        const prefix = 'TRT-';
        const lastRecord = await this.treatmentModel
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
            const existing = await this.treatmentModel.exists({ mrn });
            exists = !!existing;
            if (exists)
                nextNumber++;
        } while (exists);
        return mrn;
    }
    async getDefaultTherapist() {
        const inChargeTherapist = await this.employeeModel
            .findOne({
            role: { $regex: new RegExp('^Therapist$', 'i') },
            inCharge: true,
            isDeleted: { $ne: true },
            status: { $regex: new RegExp('^active$', 'i') },
        })
            .lean()
            .exec();
        if (inChargeTherapist) {
            return {
                therapist: inChargeTherapist._id,
                therapistName: inChargeTherapist.name,
            };
        }
        const firstTherapist = await this.employeeModel
            .findOne({
            role: { $regex: new RegExp('^Therapist$', 'i') },
            isDeleted: { $ne: true },
            status: { $regex: new RegExp('^active$', 'i') },
        })
            .lean()
            .exec();
        if (firstTherapist) {
            return {
                therapist: firstTherapist._id,
                therapistName: firstTherapist.name,
            };
        }
        return {
            therapist: null,
            therapistName: 'Therapist In-Charge',
        };
    }
    async createFromConsultation(payload) {
        if (!payload.items || payload.items.length === 0) {
            throw new common_1.BadRequestException('Treatment items are required');
        }
        const { therapist, therapistName } = await this.getDefaultTherapist();
        const formattedItems = payload.items.map((item) => {
            const unitPrice = Number(item.unitPrice ?? 0);
            const quantity = Number(item.quantity ?? 1);
            const discount = Number(item.discount ?? 0);
            const gst = Number(item.gst ?? 0);
            const total = Number(item.total ?? unitPrice * quantity - discount);
            return {
                name: item.parentName
                    ? `${item.parentName} - ${item.name}`
                    : item.name || 'Treatment Item',
                therapyId: item.therapyId && mongoose_2.default.isValidObjectId(item.therapyId)
                    ? new mongoose_2.default.Types.ObjectId(item.therapyId)
                    : undefined,
                subTherapyId: item.subTherapyId ? String(item.subTherapyId) : undefined,
                procedureId: item.procedureId && mongoose_2.default.isValidObjectId(item.procedureId)
                    ? new mongoose_2.default.Types.ObjectId(item.procedureId)
                    : undefined,
                subProcedureId: item.subProcedureId
                    ? String(item.subProcedureId)
                    : undefined,
                parentName: item.parentName || undefined,
                code: item.code || undefined,
                quantity,
                unitPrice,
                gst,
                discount,
                total,
            };
        });
        const category = payload.type === treatment_schema_1.TreatmentType.Procedure ? 'Procedure' : 'Therapy';
        const dates = payload.treatmentDates && payload.treatmentDates.length > 0
            ? payload.treatmentDates.map((d) => new Date(d))
            : [payload.treatmentDate ? new Date(payload.treatmentDate) : new Date()];
        dates.sort((a, b) => a.getTime() - b.getTime());
        const rootMrn = await this.generateUniqueMRN();
        const rootTreatment = new this.treatmentModel({
            mrn: rootMrn,
            patient: payload.patient,
            doctor: payload.doctor || null,
            doctorName: payload.doctorName || 'Doctor',
            consulting: payload.consultingId || null,
            type: payload.type,
            category,
            items: formattedItems,
            therapist,
            therapistName,
            status: treatment_schema_1.TreatmentStatus.Pending,
            billingStatus: treatment_schema_1.TreatmentBillingStatus.Unbilled,
            prescriptionDate: new Date(),
            treatmentDate: dates[0],
            notes: payload.notes || '',
            sessionNumber: 1,
            parentTreatment: null,
            isRepeated: false,
            isDeleted: false,
        });
        const savedRoot = await rootTreatment.save();
        if (dates.length > 1) {
            for (let i = 1; i < dates.length; i++) {
                const sessionMrn = await this.generateUniqueMRN();
                const nextSession = new this.treatmentModel({
                    mrn: sessionMrn,
                    patient: payload.patient,
                    doctor: payload.doctor || null,
                    doctorName: payload.doctorName || 'Doctor',
                    consulting: payload.consultingId || null,
                    type: payload.type,
                    category,
                    items: formattedItems,
                    therapist,
                    therapistName,
                    status: treatment_schema_1.TreatmentStatus.Pending,
                    billingStatus: treatment_schema_1.TreatmentBillingStatus.Unbilled,
                    prescriptionDate: new Date(),
                    treatmentDate: dates[i],
                    notes: payload.notes || '',
                    sessionNumber: i + 1,
                    parentTreatment: savedRoot._id,
                    isRepeated: true,
                    isDeleted: false,
                });
                await nextSession.save();
            }
        }
        return savedRoot;
    }
    async create(createDto) {
        const namedTherapist = (createDto.therapistName || '').trim();
        const therapistName = namedTherapist && namedTherapist !== '-' ? namedTherapist : '-';
        const therapistId = therapistName !== '-' ? createDto.therapist || null : null;
        const mrn = await this.generateUniqueMRN();
        const formattedItems = (createDto.items || []).map((item) => {
            const unitPrice = Number(item.unitPrice ?? 0);
            const quantity = Number(item.quantity ?? 1);
            const discount = Number(item.discount ?? 0);
            const gst = Number(item.gst ?? 0);
            const total = Number(item.total ?? unitPrice * quantity - discount);
            return {
                ...item,
                quantity,
                unitPrice,
                discount,
                gst,
                total,
            };
        });
        const dates = createDto.treatmentDates && createDto.treatmentDates.length > 0
            ? createDto.treatmentDates.map((d) => new Date(d))
            : [
                createDto.treatmentDate
                    ? new Date(createDto.treatmentDate)
                    : new Date(),
            ];
        dates.sort((a, b) => a.getTime() - b.getTime());
        const rootMrn = await this.generateUniqueMRN();
        const rootTreatment = new this.treatmentModel({
            ...createDto,
            mrn: rootMrn,
            therapist: therapistId,
            therapistName,
            items: formattedItems,
            type: createDto.type || treatment_schema_1.TreatmentType.Therapy,
            category: createDto.category ||
                (createDto.type === treatment_schema_1.TreatmentType.Procedure ? 'Procedure' : 'Therapy'),
            status: createDto.status || treatment_schema_1.TreatmentStatus.Pending,
            billingStatus: treatment_schema_1.TreatmentBillingStatus.Unbilled,
            prescriptionDate: createDto.prescriptionDate || new Date(),
            treatmentDate: dates[0],
            sessionNumber: 1,
            parentTreatment: null,
            isRepeated: false,
            isDeleted: false,
        });
        const savedRoot = await rootTreatment.save();
        if (dates.length > 1) {
            for (let i = 1; i < dates.length; i++) {
                const sessionMrn = await this.generateUniqueMRN();
                const nextSession = new this.treatmentModel({
                    mrn: sessionMrn,
                    patient: createDto.patient,
                    doctor: createDto.doctor || null,
                    doctorName: createDto.doctorName || 'Self',
                    consulting: createDto.consulting || null,
                    type: createDto.type || treatment_schema_1.TreatmentType.Therapy,
                    category: createDto.category ||
                        (createDto.type === treatment_schema_1.TreatmentType.Procedure
                            ? 'Procedure'
                            : 'Therapy'),
                    items: formattedItems,
                    therapist: therapistId,
                    therapistName,
                    status: treatment_schema_1.TreatmentStatus.Pending,
                    billingStatus: treatment_schema_1.TreatmentBillingStatus.Unbilled,
                    prescriptionDate: createDto.prescriptionDate || new Date(),
                    treatmentDate: dates[i],
                    notes: createDto.notes || '',
                    discount: createDto.discount || 0,
                    sessionNumber: i + 1,
                    parentTreatment: savedRoot._id,
                    isRepeated: true,
                    isDeleted: false,
                });
                await nextSession.save();
            }
        }
        return savedRoot;
    }
    async findAll(query) {
        const { page = 1, limit = 20, q, status, type, billingStatus, startDate, endDate, patient, therapist, sort, } = query;
        const skip = (page - 1) * limit;
        const filter = { isDeleted: { $ne: true } };
        if (status && status !== 'all') {
            filter.status = status;
        }
        if (type && type !== 'all') {
            filter.type = type;
        }
        if (billingStatus && billingStatus !== 'all') {
            filter.billingStatus = billingStatus;
        }
        if (patient && mongoose_2.default.isValidObjectId(patient)) {
            filter.patient = new mongoose_2.default.Types.ObjectId(patient);
        }
        const andConditions = [];
        if (therapist) {
            if (mongoose_2.default.isValidObjectId(therapist)) {
                andConditions.push({
                    $or: [
                        { therapist: new mongoose_2.default.Types.ObjectId(therapist) },
                        { therapistName: { $regex: therapist, $options: 'i' } },
                    ],
                });
            }
            else {
                filter.therapistName = { $regex: therapist.trim(), $options: 'i' };
            }
        }
        if (startDate && endDate) {
            filter.treatmentDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        else if (startDate) {
            filter.treatmentDate = { $gte: new Date(startDate) };
        }
        else if (endDate) {
            filter.treatmentDate = { $lte: new Date(endDate) };
        }
        if (q && q.trim()) {
            const term = q.trim();
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const searchRegex = { $regex: escaped, $options: 'i' };
            const patientIds = await this.findPatientIdsByNameOrMrn(searchRegex);
            const matches = [
                { mrn: searchRegex },
                { billNo: searchRegex },
                { doctorName: searchRegex },
                { therapistName: searchRegex },
                { notes: searchRegex },
                { 'items.name': searchRegex },
            ];
            if (patientIds.length) {
                matches.push({ patient: { $in: patientIds } });
            }
            andConditions.push({ $or: matches });
        }
        if (andConditions.length > 0) {
            filter.$and = andConditions;
        }
        const [data, total] = await Promise.all([
            this.treatmentModel
                .find(filter)
                .populate('patient')
                .populate('doctor', 'name email specialization phoneNumber')
                .populate('therapist')
                .populate('bill')
                .populate('parentTreatment')
                .sort(sort === 'asc'
                ? { createdAt: 1, mrn: 1 }
                : { createdAt: -1, mrn: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.treatmentModel.countDocuments(filter),
        ]);
        return {
            data: data,
            total,
            message: 'Treatments retrieved successfully',
        };
    }
    async findPatientIdsByNameOrMrn(searchRegex) {
        const patients = this.treatmentModel?.db?.collection?.('patients');
        if (!patients)
            return [];
        try {
            const matches = await patients
                .find({ $or: [{ name: searchRegex }, { mrn: searchRegex }] }, { projection: { _id: 1 } })
                .limit(500)
                .toArray();
            return matches
                .map((patient) => patient?._id)
                .filter((id) => id && mongoose_2.default.isValidObjectId(id))
                .map((id) => new mongoose_2.default.Types.ObjectId(String(id)));
        }
        catch {
            return [];
        }
    }
    async findOne(id) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException(`Invalid treatment ID: ${id}`);
        }
        const treatment = await this.treatmentModel
            .findOne({ _id: id, isDeleted: { $ne: true } })
            .populate('patient')
            .populate('doctor', 'name email specialization phoneNumber')
            .populate('therapist')
            .populate('bill')
            .populate('parentTreatment')
            .populate('consulting')
            .lean()
            .exec();
        if (!treatment) {
            throw new common_1.NotFoundException(`Treatment with id ${id} not found`);
        }
        return treatment;
    }
    async getTimeline(id) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException(`Invalid treatment ID: ${id}`);
        }
        const current = await this.treatmentModel
            .findOne({ _id: id, isDeleted: { $ne: true } })
            .lean()
            .exec();
        if (!current) {
            throw new common_1.NotFoundException(`Treatment with id ${id} not found`);
        }
        const rootId = current.parentTreatment || current._id;
        const sessions = await this.treatmentModel
            .find({
            $or: [{ _id: rootId }, { parentTreatment: rootId }],
            isDeleted: { $ne: true },
        })
            .populate('patient')
            .populate('doctor', 'name email specialization phoneNumber')
            .populate('therapist')
            .populate('bill')
            .sort({ sessionNumber: 1, createdAt: 1 })
            .lean()
            .exec();
        const rootTreatment = sessions.find((s) => String(s._id) === String(rootId)) || current;
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter((s) => s.status === treatment_schema_1.TreatmentStatus.Completed).length;
        const totalSpend = sessions.reduce((sum, s) => {
            const itemsTotal = (s.items || []).reduce((iSum, i) => iSum + (i.total || 0), 0);
            return sum + itemsTotal - (s.discount || 0);
        }, 0);
        return {
            rootTreatment: rootTreatment,
            sessions: sessions,
            totalSessions,
            completedSessions,
            totalSpend,
            patient: rootTreatment?.patient || null,
            doctor: rootTreatment?.doctor || null,
        };
    }
    async update(id, dto) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException(`Invalid treatment ID: ${id}`);
        }
        if (dto.therapistName !== undefined && (!dto.therapistName || dto.therapistName.trim() === '')) {
            throw new common_1.BadRequestException('Therapist name cannot be empty');
        }
        const updateData = { ...dto };
        if (dto.items) {
            updateData.items = dto.items.map((item) => ({
                ...item,
                unitPrice: Number(item.unitPrice ?? 0),
                quantity: Number(item.quantity ?? 1),
                discount: Number(item.discount ?? 0),
                gst: Number(item.gst ?? 0),
                total: Number(item.total ??
                    Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1) -
                        Number(item.discount ?? 0)),
            }));
        }
        const updated = await this.treatmentModel
            .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, { $set: updateData }, { new: true })
            .populate('patient')
            .populate('doctor', 'name email specialization phoneNumber')
            .populate('therapist')
            .populate('bill')
            .lean()
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException(`Treatment with id ${id} not found`);
        }
        return updated;
    }
    async resolvePharmacyBillingUserId(userId) {
        const configured = (0, configuration_1.default)().in_house_pharmacy_id;
        if (configured && mongoose_2.default.isValidObjectId(configured)) {
            return configured.toString();
        }
        const users = this.treatmentModel?.db?.collection?.('users');
        if (users) {
            try {
                const pharmacyUser = await users.findOne({
                    role: { $regex: /^pharmacy$/i },
                });
                if (pharmacyUser?._id && mongoose_2.default.isValidObjectId(pharmacyUser._id)) {
                    return pharmacyUser._id.toString();
                }
            }
            catch {
            }
        }
        if (userId && mongoose_2.default.isValidObjectId(userId)) {
            return userId.toString();
        }
        return new mongoose_2.default.Types.ObjectId().toString();
    }
    async processSession(id, dto, userId) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException(`Invalid treatment ID: ${id}`);
        }
        const treatment = await this.treatmentModel
            .findOne({ _id: id, isDeleted: { $ne: true } })
            .populate('patient')
            .exec();
        if (!treatment) {
            throw new common_1.NotFoundException(`Treatment with id ${id} not found`);
        }
        if (treatment.status === treatment_schema_1.TreatmentStatus.Completed ||
            treatment.billingStatus === treatment_schema_1.TreatmentBillingStatus.Billed) {
            throw new common_1.BadRequestException(`This treatment session has already been processed and billed (Bill #${treatment.billNo || treatment.bill || 'Generated'}).`);
        }
        const pharmacyUserIdStr = await this.resolvePharmacyBillingUserId(userId);
        const roundRupee = (value) => {
            const amount = Number(value);
            if (!Number.isFinite(amount))
                return 0;
            return Math.round(Math.max(0, amount) * 100) / 100;
        };
        const sessionAmount = dto.amount !== undefined && dto.amount !== null
            ? roundRupee(dto.amount)
            : null;
        let billingItems = (treatment.items || []).map((item) => ({
            name: item.name,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            gst: item.gst || 0,
            discount: item.discount || 0,
            total: item.total || (item.quantity || 1) * (item.unitPrice || 0),
        }));
        if (sessionAmount !== null) {
            const lineName = (treatment.items || [])
                .map((item) => String(item.name || '').trim())
                .filter(Boolean)
                .join(', ') || `${treatment.type || 'Treatment'} session`;
            billingItems = [
                {
                    name: lineName,
                    quantity: 1,
                    unitPrice: sessionAmount,
                    gst: 0,
                    discount: 0,
                    total: sessionAmount,
                },
            ];
            (treatment.items || []).forEach((item, index) => {
                const lineTotal = index === 0 ? sessionAmount : 0;
                item.unitPrice = lineTotal;
                item.quantity = item.quantity || 1;
                item.total = lineTotal;
            });
            treatment.markModified('items');
        }
        const totalDiscount = dto.discount !== undefined ? dto.discount : treatment.discount || 0;
        const gross = roundRupee(billingItems.reduce((sum, item) => sum + Number(item.total || 0), 0));
        const netPayable = roundRupee(Math.max(0, gross - roundRupee(totalDiscount)));
        const split = roundRupee(roundRupee(dto.cash) + roundRupee(dto.card) + roundRupee(dto.upi));
        if (split !== netPayable) {
            throw new common_1.BadRequestException('Cash, Card, and UPI must equal the session amount.');
        }
        const typeLabel = treatment.type === treatment_schema_1.TreatmentType.Procedure ? 'Procedure' : 'Therapy';
        const sessionNotes = `${typeLabel} Session #${treatment.sessionNumber}`;
        const assignedTherapist = String(dto.therapistName || treatment.therapistName || '').trim();
        const therapistName = assignedTherapist && assignedTherapist !== '-' ? assignedTherapist : '';
        if (!therapistName) {
            throw new common_1.BadRequestException('A therapist must be assigned before billing a procedure.');
        }
        const billPayload = {
            user: new mongoose_2.default.Types.ObjectId(pharmacyUserIdStr),
            patient: treatment.patient?._id || treatment.patient,
            doctor: treatment.doctor || null,
            therapistName,
            items: billingItems,
            cash: dto.cash || 0,
            card: dto.card || 0,
            upi: dto.upi || 0,
            discount: totalDiscount,
            status: 'Completed',
            transactionType: 'Sale',
            billingCategory: 'Procedure',
            note: sessionNotes,
        };
        const generatedBill = await this.billingService.generateBill(billPayload);
        treatment.status = treatment_schema_1.TreatmentStatus.Completed;
        treatment.billingStatus = treatment_schema_1.TreatmentBillingStatus.Billed;
        treatment.bill = generatedBill._id;
        treatment.billNo = generatedBill.mrn;
        treatment.paidAmount = (dto.cash || 0) + (dto.card || 0) + (dto.upi || 0);
        treatment.discount = totalDiscount;
        treatment.paymentMethod = dto.paymentMethod || 'Cash';
        treatment.completedAt = dto.completedAt || new Date();
        treatment.processedBy = userId || null;
        if (dto.therapist) {
            treatment.therapist = new mongoose_2.default.Types.ObjectId(dto.therapist);
        }
        if (dto.therapistName) {
            treatment.therapistName = dto.therapistName;
        }
        const saved = await treatment.save();
        return {
            treatment: saved.toObject(),
            bill: generatedBill,
        };
    }
    async repeatSession(id, dto, userId) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException(`Invalid treatment ID: ${id}`);
        }
        const original = await this.treatmentModel
            .findOne({ _id: id, isDeleted: { $ne: true } })
            .lean()
            .exec();
        if (!original) {
            throw new common_1.NotFoundException(`Treatment with id ${id} not found`);
        }
        const rootId = original.parentTreatment || original._id;
        const count = await this.treatmentModel.countDocuments({
            $or: [{ _id: rootId }, { parentTreatment: rootId }],
            isDeleted: { $ne: true },
        });
        const nextSessionNumber = count + 1;
        let therapistId = dto.therapist || original.therapist;
        let therapistName = dto.therapistName || original.therapistName;
        if (!therapistName || therapistName.trim() === '' || therapistName === '-') {
            const def = await this.getDefaultTherapist();
            therapistId = def.therapist || therapistId;
            therapistName = def.therapistName;
        }
        const mrn = await this.generateUniqueMRN();
        const itemsToUse = dto.items && dto.items.length > 0 ? dto.items : original.items;
        const formattedItems = (itemsToUse || []).map((item) => ({
            ...item,
            quantity: Number(item.quantity ?? 1),
            unitPrice: Number(item.unitPrice ?? 0),
            discount: Number(item.discount ?? 0),
            gst: Number(item.gst ?? 0),
            total: Number(item.total ??
                Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1) -
                    Number(item.discount ?? 0)),
        }));
        const newTreatment = new this.treatmentModel({
            mrn,
            patient: original.patient,
            doctor: original.doctor,
            doctorName: original.doctorName,
            consulting: original.consulting,
            type: original.type,
            category: original.category,
            items: formattedItems,
            therapist: therapistId,
            therapistName,
            status: treatment_schema_1.TreatmentStatus.Pending,
            billingStatus: treatment_schema_1.TreatmentBillingStatus.Unbilled,
            prescriptionDate: original.prescriptionDate || new Date(),
            treatmentDate: dto.treatmentDate || new Date(),
            notes: dto.notes || original.notes || '',
            sessionNumber: nextSessionNumber,
            parentTreatment: rootId,
            isRepeated: true,
            isDeleted: false,
        });
        const saved = await newTreatment.save();
        if (dto.autoProcess) {
            const processed = await this.processSession(String(saved._id), {
                cash: dto.cash,
                card: dto.card,
                upi: dto.upi,
                discount: dto.discount,
                paymentMethod: dto.paymentMethod,
                therapist: dto.therapist,
                therapistName: dto.therapistName,
            }, userId);
            return {
                treatment: processed.treatment,
                bill: processed.bill,
            };
        }
        return {
            treatment: saved.toObject(),
        };
    }
    async delete(id) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException(`Invalid treatment ID: ${id}`);
        }
        const treatment = await this.treatmentModel.findOne({
            _id: id,
            isDeleted: { $ne: true },
        });
        if (!treatment) {
            throw new common_1.NotFoundException(`Treatment with id ${id} not found`);
        }
        if (treatment.billingStatus === treatment_schema_1.TreatmentBillingStatus.Billed ||
            treatment.status === treatment_schema_1.TreatmentStatus.Completed) {
            throw new common_1.BadRequestException(`Cannot delete a billed treatment session (Bill #${treatment.billNo}). Billed records cannot be deleted.`);
        }
        treatment.isDeleted = true;
        await treatment.save();
        return { success: true, message: 'Treatment deleted successfully' };
    }
};
exports.TreatmentService = TreatmentService;
exports.TreatmentService = TreatmentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(treatment_schema_1.Treatment.name)),
    __param(1, (0, mongoose_1.InjectModel)(employee_schema_1.Employee.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        billing_service_1.BillingService])
], TreatmentService);
//# sourceMappingURL=treatment.service.js.map