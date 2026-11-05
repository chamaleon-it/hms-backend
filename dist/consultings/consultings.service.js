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
exports.ConsultingsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = __importStar(require("mongoose"));
const mongoose_2 = require("@nestjs/mongoose");
const consulting_schema_1 = require("./schemas/consulting.schema");
const therapy_schema_1 = require("../therapy/schemas/therapy.schema");
const procedure_service_1 = require("../procedure/procedure.service");
const orders_service_1 = require("../pharmacy/orders/orders.service");
const order_schema_1 = require("../pharmacy/orders/schemas/order.schema");
const report_service_1 = require("../lab/report/report.service");
const report_schema_1 = require("../lab/report/schemas/report.schema");
const billing_service_1 = require("../billing/billing.service");
const configuration_1 = __importDefault(require("../config/configuration"));
const therapy_service_1 = require("../therapy/therapy.service");
const treatment_service_1 = require("../treatment/treatment.service");
const treatment_schema_1 = require("../treatment/schemas/treatment.schema");
const digestive_system_1 = require("./digestive-system");
let ConsultingsService = class ConsultingsService {
    consultingModel;
    therapyModel;
    therapyService;
    procedureService;
    ordersService;
    reportService;
    billingService;
    treatmentService;
    constructor(consultingModel, therapyModel, therapyService, procedureService, ordersService, reportService, billingService, treatmentService) {
        this.consultingModel = consultingModel;
        this.therapyModel = therapyModel;
        this.therapyService = therapyService;
        this.procedureService = procedureService;
        this.ordersService = ordersService;
        this.reportService = reportService;
        this.billingService = billingService;
        this.treatmentService = treatmentService;
    }
    async create(consultingDto, doctorId) {
        const inHouseLabId = (0, configuration_1.default)().in_house_lab_id;
        const defaultLabObjectId = inHouseLabId && mongoose_1.default.isValidObjectId(inHouseLabId)
            ? new mongoose_1.default.Types.ObjectId(inHouseLabId)
            : new mongoose_1.default.Types.ObjectId();
        if (Array.isArray(consultingDto.test)) {
            consultingDto.test = consultingDto.test.map((t) => {
                const validLab = t.lab && mongoose_1.default.isValidObjectId(t.lab.toString())
                    ? new mongoose_1.default.Types.ObjectId(t.lab.toString())
                    : defaultLabObjectId;
                return {
                    ...t,
                    lab: validLab,
                };
            });
        }
        let resolvedTherapies = [];
        if (consultingDto.therapy) {
            const rawTherapyList = Array.isArray(consultingDto.therapy)
                ? consultingDto.therapy
                : [consultingDto.therapy];
            resolvedTherapies = await this.therapyService.resolveTherapyItems(rawTherapyList);
        }
        let resolvedProcedures = [];
        if (consultingDto.procedure) {
            const rawProcList = Array.isArray(consultingDto.procedure)
                ? consultingDto.procedure
                : [consultingDto.procedure];
            resolvedProcedures = await this.procedureService.resolveProcedureItems(rawProcList);
        }
        const consulting = await this.consultingModel.create({
            ...consultingDto,
            therapy: resolvedTherapies,
            procedure: resolvedProcedures,
            doctor: doctorId,
        });
        const orderItems = [];
        for (const m of consultingDto.medicines || []) {
            const outside = Boolean(m.isCustom) ||
                !m.name ||
                !mongoose_1.default.isValidObjectId(String(m.name));
            if (outside) {
                const referralName = String(m.referralName || '').trim();
                if (!referralName)
                    continue;
                orderItems.push({
                    isCustom: true,
                    referralName,
                    dosage: m.dosage,
                    frequency: m.frequency,
                    food: m.food,
                    duration: m.duration,
                    quantity: m.quantity,
                });
                continue;
            }
            orderItems.push({
                name: m.name,
                isCustom: false,
                referralName: m.referralName,
                dosage: m.dosage,
                frequency: m.frequency,
                food: m.food,
                duration: m.duration,
                quantity: m.quantity,
            });
        }
        if (orderItems.length) {
            await this.ordersService.createOrder({
                doctor: doctorId,
                items: orderItems,
                patient: consultingDto.patient,
                priority: order_schema_1.OrderPriority.Normal,
                status: order_schema_1.OrderStatus.Pending,
                advice: consultingDto.advice || undefined,
            });
        }
        const tests = (consultingDto.test || []).map((t) => ({
            patient: consultingDto.patient,
            doctor: doctorId,
            lab: t.lab && mongoose_1.default.isValidObjectId(t.lab.toString())
                ? new mongoose_1.default.Types.ObjectId(t.lab.toString())
                : defaultLabObjectId,
            date: t.date,
            test: t.name.map((n) => ({ name: n })),
            priority: t.priority,
            panels: t.panels,
            sampleType: '',
            status: report_schema_1.ReportStatus.UPCOMING,
        }));
        await Promise.all(tests.map((t) => this.reportService.createReport(t)));
        const doctorUser = await this.consultingModel.db
            .collection('users')
            .findOne({ _id: new mongoose_1.default.Types.ObjectId(doctorId) });
        const doctorName = doctorUser?.name
            ? `Dr. ${doctorUser.name}`
            : 'Doctor';
        if (resolvedTherapies.length > 0) {
            try {
                await this.treatmentService.createFromConsultation({
                    type: treatment_schema_1.TreatmentType.Therapy,
                    items: resolvedTherapies,
                    patient: consultingDto.patient,
                    doctor: doctorId,
                    doctorName,
                    treatmentDates: consultingDto.therapyDates,
                    notes: consultingDto.therapyNotes ||
                        'Therapy prescribed from Doctor Consultation',
                    consultingId: consulting._id,
                });
            }
            catch (err) {
                console.error('Error creating therapy treatment request:', err);
            }
        }
        if (resolvedProcedures.length > 0) {
            try {
                await this.treatmentService.createFromConsultation({
                    type: treatment_schema_1.TreatmentType.Procedure,
                    items: resolvedProcedures,
                    patient: consultingDto.patient,
                    doctor: doctorId,
                    doctorName,
                    treatmentDates: consultingDto.procedureDates,
                    notes: consultingDto.procedureNotes ||
                        'Procedure prescribed from Doctor Consultation',
                    consultingId: consulting._id,
                });
            }
            catch (err) {
                console.error('Error creating procedure treatment request:', err);
            }
        }
        return consulting;
    }
    async getPatientConsultings(patientId) {
        if (!mongoose_1.default.isValidObjectId(patientId)) {
            throw new common_1.BadRequestException('Please provide a valid patient id');
        }
        const data = await this.consultingModel
            .find({ patient: patientId })
            .populate('patient')
            .populate('appointment')
            .populate('doctor', 'name email specialization')
            .populate('medicines.name', 'name')
            .populate('test.name', 'name code type panels')
            .populate('therapy')
            .sort({ createdAt: -1 })
            .lean();
        return data.map((row) => presentDigestiveSystem(row));
    }
    async updateTherapyStatus(id, completed) {
        if (!mongoose_1.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException('Please provide a valid consulting id');
        }
        const data = await this.consultingModel
            .findByIdAndUpdate(id, { therapyCompleted: completed }, { new: true })
            .populate('therapy')
            .lean();
        return presentDigestiveSystem(data);
    }
    async updateProcedureStatus(id, completed) {
        if (!mongoose_1.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException('Please provide a valid consulting id');
        }
        const data = await this.consultingModel
            .findByIdAndUpdate(id, { procedureCompleted: completed }, { new: true })
            .lean();
        return presentDigestiveSystem(data);
    }
};
exports.ConsultingsService = ConsultingsService;
exports.ConsultingsService = ConsultingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(consulting_schema_1.Consulting.name)),
    __param(1, (0, mongoose_2.InjectModel)(therapy_schema_1.Therapy.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        mongoose_1.Model,
        therapy_service_1.TherapyService,
        procedure_service_1.ProcedureService,
        orders_service_1.OrdersService,
        report_service_1.ReportService,
        billing_service_1.BillingService,
        treatment_service_1.TreatmentService])
], ConsultingsService);
function presentDigestiveSystem(doc) {
    if (!doc?.medicalParameters)
        return doc;
    return {
        ...doc,
        medicalParameters: {
            ...doc.medicalParameters,
            digestiveSystem: (0, digestive_system_1.normalizeDigestiveSystem)(doc.medicalParameters.digestiveSystem),
        },
    };
}
//# sourceMappingURL=consultings.service.js.map