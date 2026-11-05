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
exports.ReportService = void 0;
const common_1 = require("@nestjs/common");
const create_report_dto_1 = require("./dto/create-report.dto");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importStar(require("mongoose"));
const report_schema_1 = require("./schemas/report.schema");
const configuration_1 = __importDefault(require("../../config/configuration"));
const test_schema_1 = require("../panels/schemas/test.schema");
const patient_schema_1 = require("../../patients/schemas/patient.schema");
const panel_schema_1 = require("../panels/schemas/panel.schema");
const group_schema_1 = require("../panels/schemas/group.schema");
const billing_service_1 = require("../../billing/billing.service");
let ReportService = class ReportService {
    reportModel;
    testModel;
    patientModel;
    panelModel;
    groupModel;
    billingService;
    constructor(reportModel, testModel, patientModel, panelModel, groupModel, billingService) {
        this.reportModel = reportModel;
        this.testModel = testModel;
        this.patientModel = patientModel;
        this.panelModel = panelModel;
        this.groupModel = groupModel;
        this.billingService = billingService;
    }
    async onModuleInit() {
        try {
            const result = await this.reportModel.updateMany({ status: 'Sample Collected' }, { $set: { status: report_schema_1.ReportStatus.WAITING_FOR_RESULT } });
            if (result.modifiedCount > 0) {
            }
        }
        catch (e) {
            console.error('[Migration] Error migrating reports:', e);
        }
    }
    async createReport(dto) {
        if (!dto.lab) {
            dto.lab = new mongoose_2.default.Types.ObjectId((0, configuration_1.default)().in_house_lab_id);
        }
        const startOfDay = new Date(dto.date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(dto.date);
        endOfDay.setUTCHours(23, 59, 59, 999);
        const userReport = await this.reportModel.findOne({
            patient: dto.patient,
            status: report_schema_1.ReportStatus.UPCOMING,
            lab: dto.lab,
            date: { $gte: startOfDay, $lte: endOfDay },
            isDeleted: false,
        });
        if (!userReport) {
            const data = await this.reportModel.create(dto);
            await this.createOrUpdateDraftBill(data);
            return data;
        }
        else {
            userReport.test.push(...dto.test
                .filter((t) => !userReport.test.some((existing) => existing.name.toString() === t.name.toString()))
                .map((t) => ({ name: t.name, value: t.value ?? '' })));
            if (dto.panels && dto.panels.length > 0) {
                userReport.panels.push(...dto.panels.filter((p) => !userReport.panels.includes(p)));
            }
            if (dto.groups && dto.groups.length > 0) {
                if (!userReport.groups)
                    userReport.groups = [];
                userReport.groups.push(...dto.groups.filter((g) => !userReport.groups.includes(g)));
            }
            await userReport.save();
            await this.createOrUpdateDraftBill(userReport);
            return userReport;
        }
    }
    async createOrUpdateDraftBill(report) {
        const items = [];
        let total = 0;
        if (report.groups && report.groups.length > 0) {
            const groupsData = await this.groupModel.find({
                name: { $in: report.groups },
            });
            for (const group of groupsData) {
                items.push({
                    name: group.name,
                    quantity: 1,
                    unitPrice: group.price || 0,
                    total: group.price || 0,
                    gst: 0,
                    discount: 0,
                });
                total += group.price || 0;
            }
        }
        if (report.panels && report.panels.length > 0) {
            const panelsData = await this.panelModel.find({
                name: { $in: report.panels },
            });
            let groupPanelNames = [];
            if (report.groups && report.groups.length > 0) {
                const groupsData = await this.groupModel
                    .find({ name: { $in: report.groups } })
                    .populate('panels');
                groupPanelNames = groupsData
                    .flatMap((g) => g.panels || [])
                    .map((p) => p.name || p.toString());
            }
            for (const panel of panelsData) {
                if (!groupPanelNames.includes(panel.name)) {
                    items.push({
                        name: panel.name,
                        quantity: 1,
                        unitPrice: panel.price || 0,
                        total: panel.price || 0,
                        gst: 0,
                        discount: 0,
                    });
                    total += panel.price || 0;
                }
            }
        }
        if (report.test && report.test.length > 0) {
            const testIds = report.test.map((t) => t.name);
            const testsData = await this.testModel.find({ _id: { $in: testIds } });
            let panelTestIds = [];
            let groupTestIds = [];
            if (report.panels && report.panels.length > 0) {
                const panelsData = await this.panelModel.find({
                    name: { $in: report.panels },
                });
                panelTestIds = panelsData
                    .flatMap((p) => p.tests || [])
                    .map((id) => id.toString());
            }
            if (report.groups && report.groups.length > 0) {
                const groupsData = await this.groupModel
                    .find({ name: { $in: report.groups } })
                    .populate('tests')
                    .populate('panels');
                groupTestIds = groupsData
                    .flatMap((g) => g.tests || [])
                    .map((t) => t._id?.toString() || t.toString());
                const groupPanelIds = groupsData
                    .flatMap((g) => g.panels || [])
                    .map((p) => p.name || p.toString());
                const groupPanelsData = await this.panelModel.find({
                    name: { $in: groupPanelIds },
                });
                groupTestIds.push(...groupPanelsData
                    .flatMap((p) => p.tests || [])
                    .map((id) => id.toString()));
            }
            for (const test of testsData) {
                if (!panelTestIds.includes(test._id.toString()) &&
                    !groupTestIds.includes(test._id.toString())) {
                    items.push({
                        name: test.name,
                        quantity: 1,
                        unitPrice: test.price || 0,
                        total: test.price || 0,
                        gst: 0,
                        discount: 0,
                    });
                    total += test.price || 0;
                }
            }
        }
        let existingBill;
        try {
            existingBill = await this.billingService['billingModel'].findOne({
                reportId: report._id,
            });
        }
        catch (e) {
            console.error('Error generating report items PDF:', e);
        }
        if (existingBill) {
            if (existingBill.status === 'Draft') {
                await this.billingService.updateBill(existingBill._id, {
                    items,
                });
            }
        }
        else {
            await this.billingService.generateBill({
                patient: report.patient,
                user: report.lab,
                doctor: report.doctor ?? null,
                items,
                cash: 0,
                card: 0,
                upi: 0,
                discount: 0,
                reportId: report._id,
                billingCategory: 'Other',
                status: 'Draft',
            });
        }
    }
    async getReport(user, dto) {
        const match = {
            $or: [{ doctor: user }, { lab: user }, { patient: user }],
        };
        match.isDeleted = false;
        if (dto.status) {
            if (dto.status === 'Flagged') {
                match.isFlagged = true;
            }
            else if (dto.status === 'Deleted') {
                match.isDeleted = true;
            }
            else {
                match.status = dto.status;
            }
        }
        if (dto.startDate && dto.endDate) {
            match.createdAt = {
                $gte: dto.startDate,
                $lte: dto.endDate,
            };
        }
        const data = await this.reportModel
            .find(match)
            .populate('doctor', 'name specialization')
            .populate('lab', 'name specialization')
            .populate('patient')
            .populate({
            path: 'test.name',
            populate: {
                path: 'panels',
                populate: {
                    path: 'tests',
                    select: 'name',
                },
            },
        })
            .lean()
            .exec();
        return data;
    }
    async updateResult(dto) {
        const { _id, test, collectedDate, reportedDate } = dto;
        const report = await this.reportModel.findById(_id);
        if (!report)
            throw new common_1.NotFoundException('Report not found');
        test.forEach((n) => {
            if (!n?.name?._id)
                return;
            const index = report.test.findIndex((x) => x?.name?.toString() === n.name._id.toString());
            if (index !== -1) {
                if (n.value !== undefined) {
                    report.test[index].value = n.value;
                }
            }
        });
        if (dto.note !== undefined) {
            report.note = dto.note;
        }
        const allFilled = report.test.every((item) => {
            return (item.value !== null && item.value !== '' && item.value !== undefined);
        });
        if (dto.status === 'Completed') {
            report.status = report_schema_1.ReportStatus.COMPLETED;
        }
        else {
            report.status = allFilled
                ? report_schema_1.ReportStatus.COMPLETED
                : report_schema_1.ReportStatus.WAITING_FOR_RESULT;
        }
        await report.save();
        if (allFilled || dto.status === 'Completed') {
            await this.billingService.updateBillStatusByReportId(report._id, 'Completed');
        }
        if (collectedDate || reportedDate) {
            const updateData = {};
            if (collectedDate)
                updateData.sampleCollectedAt = new Date(collectedDate);
            if (reportedDate)
                updateData.testStartedAt = new Date(reportedDate);
            await this.reportModel.updateOne({ _id: report._id }, { $set: updateData }, { timestamps: false, strict: false });
        }
        return { message: 'Updated successfully' };
    }
    async updateFromLis(dto) {
        const { sampleId, patientId, machine, results, graphs } = dto;
        const escapedSampleId = String(sampleId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let report = await this.reportModel.findOne({
            sampleId: { $regex: `^${escapedSampleId}(?:\\s|\\(|$)`, $options: 'i' },
            isDeleted: false,
            status: { $ne: report_schema_1.ReportStatus.COMPLETED },
        });
        if (!report && patientId && patientId !== 'Unknown') {
            const patient = await this.patientModel.findOne({ mrn: patientId });
            if (patient) {
                report = await this.reportModel
                    .findOne({
                    patient: patient._id,
                    isDeleted: false,
                    status: { $ne: report_schema_1.ReportStatus.COMPLETED },
                })
                    .sort({ createdAt: -1 });
            }
        }
        if (!report) {
            throw new common_1.NotFoundException(`Active Report for sampleId ${sampleId} or patientId ${patientId} not found`);
        }
        const testIdsInReport = report.test.map((t) => t.name);
        const tests = await this.testModel.find({ _id: { $in: testIdsInReport } });
        let updatedCount = 0;
        tests.forEach((testDoc) => {
            let matchedKey = null;
            for (const key of Object.keys(results)) {
                const k = key.toLowerCase();
                const cleanK = k.replace(/[^a-z0-9]/g, '');
                const baseK = k.replace(/[^a-z0-9\-\+]/g, '');
                const tCode = (testDoc.code || '').toLowerCase();
                const tName = (testDoc.name || '').toLowerCase();
                if (tCode === k || tName === k) {
                    matchedKey = key;
                    break;
                }
                const isPercentTest = tName.includes('%') || tName.includes('percentage');
                const isAbsoluteTest = tName.includes('#') ||
                    tName.includes('abs') ||
                    tName.includes('absolute');
                const isMachinePercent = k.includes('%');
                const isMachineAbsolute = k.includes('#');
                if ((isPercentTest && isMachineAbsolute) ||
                    (isAbsoluteTest && isMachinePercent)) {
                    continue;
                }
                if (tName.includes(`(${k})`) ||
                    tName.includes(`(${k}+)`) ||
                    tName.includes(`(${k}-)`) ||
                    (cleanK.length >= 3 && new RegExp(`\\b${cleanK}\\b`).test(tName)) ||
                    (k === 'na' && tName.includes('sodium')) ||
                    (k === 'k' && tName.includes('potassium')) ||
                    (k === 'cl' && tName.includes('chloride')) ||
                    (k === 'wbc' &&
                        (tName.includes('white blood') ||
                            tName.includes('total count') ||
                            new RegExp(`\\btc\\b`).test(tName))) ||
                    (k === 'rbc' && tName.includes('red blood')) ||
                    (k === 'hgb' &&
                        (tName.includes('hemoglobin') ||
                            tName.includes('(hb)') ||
                            tName === 'hb' ||
                            tName.includes('haemoglobin'))) ||
                    (k === 'hct' &&
                        (tName.includes('hematocrit') ||
                            new RegExp(`\\bpcv\\b`).test(tName))) ||
                    (baseK === 'lym' && tName.includes('lymphocyte')) ||
                    (baseK === 'gran' &&
                        (tName.includes('granulocyte') || tName.includes('neutrophil'))) ||
                    (baseK === 'mid' &&
                        (tName.includes('monocyte') || tName.includes('eosinophil'))) ||
                    (k === 'plt' &&
                        (new RegExp(`\\bplatelet\\b`).test(tName) ||
                            new RegExp(`\\bplatelets\\b`).test(tName))) ||
                    (k === 'pct' && tName.includes('plateletcrit')) ||
                    (baseK === 'mentzr' && tName.includes('mentzer')) ||
                    (baseK === 'rdwi' && tName.includes('rdwi'))) {
                    matchedKey = key;
                    break;
                }
            }
            if (matchedKey &&
                results[matchedKey] &&
                results[matchedKey].value !== undefined) {
                const index = report.test.findIndex((x) => x?.name?.toString() === testDoc._id.toString());
                if (index !== -1) {
                    report.test[index].value = results[matchedKey].value;
                    updatedCount++;
                }
            }
        });
        const allFilled = report.test.every((item) => {
            return (item.value !== null && item.value !== '' && item.value !== undefined);
        });
        if (!report.testStartedAt && updatedCount > 0) {
            report.testStartedAt = new Date();
        }
        report.status = allFilled
            ? report_schema_1.ReportStatus.COMPLETED
            : report_schema_1.ReportStatus.WAITING_FOR_RESULT;
        if (graphs && Object.keys(graphs).length > 0) {
            if (!report.graphs)
                report.graphs = {};
            Object.assign(report.graphs, graphs);
            report.markModified('graphs');
        }
        await report.save();
        if (allFilled) {
            await this.billingService.updateBillStatusByReportId(report._id, 'Completed');
        }
        return {
            message: `LIS Result processed from ${machine}. Updated ${updatedCount} parameters.`,
            reportId: report._id,
        };
    }
    async getPatientReports(patient) {
        if (!mongoose_2.default.isValidObjectId(patient))
            throw new common_1.BadRequestException('Please provide a valid patient id.');
        const report = await this.reportModel
            .find({ patient, isDeleted: false })
            .populate('doctor', 'name specialization')
            .populate('lab', 'name')
            .populate('test.name')
            .sort({ createdAt: -1 })
            .lean()
            .exec();
        return report;
    }
    async getPatients(query = {}) {
        const { page = 1, limit = 20, alreadyPurchase = 'false', q, query: queryParam, gender, doctor, lastVisit, from, to, age, minAge, maxAge, address, city, district, state, pincode, } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const limitNum = Number(limit);
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
        const patientMatch = { status: { $ne: 'Deleted' } };
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
            patientMatch.$or = orConditions;
        }
        if (gender) {
            patientMatch.gender = gender;
        }
        if (address) {
            const addressSearchTerm = address.trim();
            patientMatch.$and = patientMatch.$and || [];
            patientMatch.$and.push({
                $or: [
                    { addressLine1: { $regex: addressSearchTerm, $options: 'i' } },
                    { addressLine2: { $regex: addressSearchTerm, $options: 'i' } },
                    { address: { $regex: addressSearchTerm, $options: 'i' } },
                ],
            });
        }
        if (city) {
            patientMatch.city = { $regex: city.trim(), $options: 'i' };
        }
        if (district) {
            patientMatch.district = { $regex: district.trim(), $options: 'i' };
        }
        if (state) {
            patientMatch.state = { $regex: state.trim(), $options: 'i' };
        }
        if (pincode) {
            patientMatch.pinCode = { $regex: pincode.trim(), $options: 'i' };
        }
        if (doctor && alreadyPurchase === 'false') {
            patientMatch.doctor = new mongoose_2.default.Types.ObjectId(doctor);
        }
        if (minA !== undefined &&
            maxA !== undefined &&
            !isNaN(minA) &&
            !isNaN(maxA)) {
            if (minA > 0 || maxA < 100) {
                const now = new Date();
                const minDate = new Date(now.getFullYear() - maxA - 1, now.getMonth(), now.getDate() + 1);
                const maxDate = new Date(now.getFullYear() - minA, now.getMonth(), now.getDate(), 23, 59, 59, 999);
                patientMatch.$expr = {
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
        const reportMatch = {
            patient: { $exists: true, $ne: null },
            isDeleted: false,
        };
        if (lastVisit) {
            const now = new Date();
            if (lastVisit === '7') {
                const dateLimit = new Date(now.setDate(now.getDate() - 7));
                reportMatch.createdAt = { $gte: dateLimit };
            }
            else if (lastVisit === '30') {
                const dateLimit = new Date(now.setDate(now.getDate() - 30));
                reportMatch.createdAt = { $gte: dateLimit };
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
                reportMatch.createdAt = dateMatch;
            }
        }
        if (alreadyPurchase === 'false' && lastVisit) {
            const testedPatientIds = await this.reportModel.distinct('patient', reportMatch);
            patientMatch._id = { $in: testedPatientIds };
        }
        let patientIds = null;
        let total = 0;
        if (alreadyPurchase === 'true') {
            if (doctor) {
                reportMatch.doctor = new mongoose_2.default.Types.ObjectId(doctor);
            }
            const pipeline = [
                { $match: reportMatch },
                {
                    $group: {
                        _id: '$patient',
                        visits: { $sum: 1 },
                        lastVisit: { $max: '$createdAt' },
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
                {
                    $unwind: {
                        path: '$patientDetail',
                        preserveNullAndEmptyArrays: false,
                    },
                },
                { $match: { 'patientDetail.status': { $ne: 'Deleted' } } },
            ];
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
                pipeline.push({
                    $match: { $or: orConditions },
                });
            }
            if (gender) {
                pipeline.push({ $match: { 'patientDetail.gender': gender } });
            }
            if (address) {
                const addressSearchTerm = address.trim();
                pipeline.push({
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
                pipeline.push({
                    $match: {
                        'patientDetail.city': { $regex: city.trim(), $options: 'i' },
                    },
                });
            }
            if (district) {
                pipeline.push({
                    $match: {
                        'patientDetail.district': {
                            $regex: district.trim(),
                            $options: 'i',
                        },
                    },
                });
            }
            if (state) {
                pipeline.push({
                    $match: {
                        'patientDetail.state': { $regex: state.trim(), $options: 'i' },
                    },
                });
            }
            if (pincode) {
                pipeline.push({
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
                    pipeline.push({
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
            const countResult = await this.reportModel.aggregate([
                ...pipeline,
                { $count: 'total' },
            ]);
            total = countResult[0]?.total ?? 0;
            const result = await this.reportModel.aggregate([
                ...pipeline,
                { $sort: { lastVisit: -1 } },
                ...(limitNum > 0 ? [{ $skip: skip }, { $limit: limitNum }] : []),
            ]);
            patientIds = result.map((item) => item._id);
        }
        else {
            total = await this.patientModel.countDocuments(patientMatch);
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
                .find(patientMatch)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum > 0 ? limitNum : 0)
                .lean()
                .exec();
        }
        const reports = await this.reportModel
            .find({
            patient: { $in: patients.map((e) => e._id) },
            isDeleted: false,
        })
            .lean()
            .exec();
        const data = patients.map((e) => {
            const patientReports = reports.filter((i) => i.patient.toString() === e._id.toString());
            patientReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return {
                visits: patientReports.length,
                ...e,
                lastVisit: patientReports[0]?.createdAt ?? null,
            };
        });
        return { data, total };
    }
    async sampleCollected(id, dto) {
        if (dto.sampleId) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const rawSampleId = dto.sampleId.split(' (')[0].trim();
            const duplicateReport = await this.reportModel.findOne({
                _id: { $ne: id },
                sampleId: { $regex: new RegExp(`^${rawSampleId}\\b`, 'i') },
                createdAt: { $gte: today },
            });
            if (duplicateReport) {
                throw new common_1.ConflictException(`Warning: Sample ID "${rawSampleId}" is already assigned to another test today.`);
            }
        }
        const data = await this.reportModel.findById(id);
        if (!data) {
            throw new common_1.NotFoundException('Records not found');
        }
        data.status = report_schema_1.ReportStatus.WAITING_FOR_RESULT;
        data.sampleCollectedAt = new Date();
        data.testStartedAt = new Date();
        data.sampleId = dto.sampleId;
        data.sampleType = dto?.sampleType || '';
        await data.save();
        return data;
    }
    async startTest(id) {
        const data = await this.reportModel.findById(id);
        if (!data) {
            throw new common_1.NotFoundException('Records not found');
        }
        data.status = report_schema_1.ReportStatus.WAITING_FOR_RESULT;
        data.testStartedAt = new Date();
        await data.save();
        return data;
    }
    async deleteReport(id) {
        const data = await this.reportModel.findById(id);
        if (!data) {
            throw new common_1.NotFoundException('Records not found');
        }
        data.isDeleted = true;
        await data.save();
        return data;
    }
    async markAsFlagged(id) {
        const data = await this.reportModel.findById(id);
        if (!data) {
            throw new common_1.NotFoundException('Records not found');
        }
        data.isFlagged = true;
        await data.save();
        return data;
    }
    async markAsUnflagged(id) {
        const data = await this.reportModel.findById(id);
        if (!data) {
            throw new common_1.NotFoundException('Records not found');
        }
        data.isFlagged = false;
        await data.save();
        return data;
    }
    async getStatistics() {
        const data = await this.reportModel.aggregate([
            {
                $match: {
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    upcoming: {
                        $sum: {
                            $cond: {
                                if: { $eq: ['$status', report_schema_1.ReportStatus.UPCOMING] },
                                then: 1,
                                else: 0,
                            },
                        },
                    },
                    sampleCollected: {
                        $sum: {
                            $cond: {
                                if: { $eq: ['$status', report_schema_1.ReportStatus.SAMPLE_COLLECTED] },
                                then: 1,
                                else: 0,
                            },
                        },
                    },
                    waitingForResult: {
                        $sum: {
                            $cond: {
                                if: { $eq: ['$status', report_schema_1.ReportStatus.WAITING_FOR_RESULT] },
                                then: 1,
                                else: 0,
                            },
                        },
                    },
                    completed: {
                        $sum: {
                            $cond: {
                                if: { $eq: ['$status', report_schema_1.ReportStatus.COMPLETED] },
                                then: 1,
                                else: 0,
                            },
                        },
                    },
                    flagged: {
                        $sum: {
                            $cond: {
                                if: { $eq: ['$isFlagged', true] },
                                then: 1,
                                else: 0,
                            },
                        },
                    },
                },
            },
        ]);
        return data[0];
    }
    async resetTimer(id, dto) {
        const data = await this.reportModel.findById(id);
        if (!data) {
            throw new common_1.NotFoundException('Records not found');
        }
        data.extraTime = data.extraTime + dto.duration;
        await data.save();
        return data;
    }
    async recoverReport(id) {
        const data = await this.reportModel.findById(id);
        if (!data) {
            throw new common_1.NotFoundException('Records not found');
        }
        data.isDeleted = false;
        await data.save();
        return data;
    }
    async updateReport(id, dto) {
        const data = await this.reportModel.findById(id);
        if (!data) {
            throw new common_1.NotFoundException('Records not found');
        }
        if (dto.test) {
            data.test = dto.test.map((t) => ({
                name: t.name,
                value: t.value ?? '',
            }));
        }
        if (dto.panels) {
            data.panels = dto.panels;
        }
        if (dto.priority) {
            data.priority = dto.priority;
        }
        if (dto.date) {
            data.date = dto.date;
        }
        await data.save();
        await this.createOrUpdateDraftBill(data);
        return data;
    }
    async repeatReport(id) {
        const data = await this.reportModel.findById(id);
        if (!data) {
            throw new common_1.NotFoundException('Records not found');
        }
        const newReport = await this.createReport({
            date: new Date(),
            doctor: data.doctor || null,
            panels: data.panels,
            test: data.test,
            patient: data.patient,
            priority: data.priority,
            sampleType: data.sampleType || '',
            status: report_schema_1.ReportStatus.UPCOMING,
            lab: data.lab,
        });
        return newReport;
    }
};
exports.ReportService = ReportService;
__decorate([
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_report_dto_1.CreateReportDto]),
    __metadata("design:returntype", Promise)
], ReportService.prototype, "createReport", null);
exports.ReportService = ReportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(report_schema_1.Report.name)),
    __param(1, (0, mongoose_1.InjectModel)(test_schema_1.Test.name)),
    __param(2, (0, mongoose_1.InjectModel)(patient_schema_1.Patient.name)),
    __param(3, (0, mongoose_1.InjectModel)(panel_schema_1.Panel.name)),
    __param(4, (0, mongoose_1.InjectModel)(group_schema_1.Group.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        billing_service_1.BillingService])
], ReportService);
//# sourceMappingURL=report.service.js.map