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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultingSchema = exports.Consulting = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importStar(require("mongoose"));
const configuration_1 = __importDefault(require("../../config/configuration"));
let Consulting = class Consulting {
    patient;
    appointment;
    doctor;
    consultationNotes;
    examinationNote;
    medicalParameters;
    medicines;
    therapy;
    therapyCompleted;
    therapyNotes;
    procedure;
    procedureCompleted;
    procedureNotes;
    advice;
    followUp;
    test;
    consultationType;
    chiefComplaints;
    lifestyle;
    acupunctureAssessment;
    treatmentPlan;
    medicalHistoryDetails;
    acupunctureExamination;
    followUpDetails;
};
exports.Consulting = Consulting;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'Patient' }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], Consulting.prototype, "patient", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'Appointment' }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], Consulting.prototype, "appointment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], Consulting.prototype, "doctor", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            presentHistory: { type: String, default: null },
            pastHistory: { type: String, default: null },
            diagnosis: { type: String, default: null },
        },
        required: true,
    }),
    __metadata("design:type", Object)
], Consulting.prototype, "consultationNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            hr: { type: String, default: null },
            bp: { type: String, default: null },
            spo2: { type: String, default: null },
            temp: { type: String, default: null },
            tempUnit: { type: String, default: null },
            rs: { type: String, default: null },
            cvs: { type: String, default: null },
            pa: { type: String, default: null },
            cns: { type: String, default: null },
            le: { type: String, default: null },
            otherNotes: { type: String, default: null },
        },
        required: true,
    }),
    __metadata("design:type", Object)
], Consulting.prototype, "examinationNote", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            sleep: { type: String, default: null },
            bowelMovement: { type: String, default: null },
            urineMovement: { type: String, default: null },
            appetite: { type: String, default: null },
            digestiveSystem: { type: [String], default: null },
        },
        required: false,
    }),
    __metadata("design:type", Object)
], Consulting.prototype, "medicalParameters", void 0);
__decorate([
    (0, mongoose_1.Prop)([
        {
            name: {
                type: mongoose_2.Types.ObjectId,
                ref: 'Item',
                required: false,
                default: null,
            },
            referralName: { type: String, default: '' },
            isCustom: { type: Boolean, default: false },
            dosage: { type: String, required: true },
            frequency: { type: String, required: true },
            food: { type: String, required: true },
            duration: { type: String, required: true },
            quantity: { type: Number, required: true },
        },
    ]),
    __metadata("design:type", Array)
], Consulting.prototype, "medicines", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                therapyId: {
                    type: mongoose_2.default.Schema.Types.ObjectId,
                    ref: 'Therapy',
                    default: null,
                },
                subTherapyId: { type: String, default: null },
                name: { type: String, required: true },
                parentName: { type: String, default: null },
                code: { type: String, default: null },
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Consulting.prototype, "therapy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Consulting.prototype, "therapyCompleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], Consulting.prototype, "therapyNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                procedureId: {
                    type: mongoose_2.default.Schema.Types.ObjectId,
                    ref: 'Procedure',
                    default: null,
                },
                subProcedureId: { type: String, default: null },
                name: { type: String, required: true },
                parentName: { type: String, default: null },
                code: { type: String, default: null },
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Consulting.prototype, "procedure", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Consulting.prototype, "procedureCompleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], Consulting.prototype, "procedureNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], Consulting.prototype, "advice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Consulting.prototype, "followUp", void 0);
__decorate([
    (0, mongoose_1.Prop)([
        {
            name: [{ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'Test' }],
            date: { type: Date, required: true },
            lab: {
                type: mongoose_2.default.Schema.Types.ObjectId,
                required: false,
                default: (0, configuration_1.default)().in_house_lab_id,
                ref: 'User',
            },
            priority: { type: String, required: true },
        },
    ]),
    __metadata("design:type", Array)
], Consulting.prototype, "test", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: 'standard' }),
    __metadata("design:type", String)
], Consulting.prototype, "consultationType", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            complaints: [{ type: String }],
            other: { type: String, default: null },
            duration: { type: String, default: null },
            painScore: { type: Number, default: null },
        },
        required: false,
    }),
    __metadata("design:type", Object)
], Consulting.prototype, "chiefComplaints", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            sleep: { type: String, default: null },
            bowel: { type: String, default: null },
            appetite: { type: String, default: null },
            stress: { type: String, default: null },
            exercise: { type: String, default: null },
            smoking: { type: String, default: null },
            alcohol: { type: String, default: null },
            micturition: { type: String, default: null },
        },
        required: false,
    }),
    __metadata("design:type", Object)
], Consulting.prototype, "lifestyle", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            clinicalDiagnosis: { type: String, default: null },
            treatmentPrinciple: { type: String, default: null },
        },
        required: false,
    }),
    __metadata("design:type", Object)
], Consulting.prototype, "acupunctureAssessment", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            sessions: { type: String, default: null },
            frequency: { type: String, default: null },
            homeCare: [{ type: String }],
        },
        required: false,
    }),
    __metadata("design:type", Object)
], Consulting.prototype, "treatmentPlan", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            medHistory: [{ type: String }],
            otherMedHistory: { type: String, default: null },
            currentMedications: { type: String, default: null },
            allergies: { type: String, default: null },
        },
        required: false,
    }),
    __metadata("design:type", Object)
], Consulting.prototype, "medicalHistoryDetails", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            bp: { type: String, default: null },
            pulse: { type: String, default: null },
            tenderness: { type: String, default: null },
            rom: { type: String, default: null },
            posture: { type: String, default: null },
            specialFindings: { type: String, default: null },
        },
        required: false,
    }),
    __metadata("design:type", Object)
], Consulting.prototype, "acupunctureExamination", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            nextAppt: { type: Date, default: null },
            feedback: { type: String, default: null },
            additionalNotes: { type: String, default: null },
            signature: { type: String, default: null },
        },
        required: false,
    }),
    __metadata("design:type", Object)
], Consulting.prototype, "followUpDetails", void 0);
exports.Consulting = Consulting = __decorate([
    (0, mongoose_1.Schema)({ versionKey: false, timestamps: true })
], Consulting);
exports.ConsultingSchema = mongoose_1.SchemaFactory.createForClass(Consulting);
//# sourceMappingURL=consulting.schema.js.map