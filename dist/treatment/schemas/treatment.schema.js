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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentSchema = exports.Treatment = exports.TreatmentItemSchema = exports.TreatmentItem = exports.TreatmentBillingStatus = exports.TreatmentStatus = exports.TreatmentType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importStar(require("mongoose"));
var TreatmentType;
(function (TreatmentType) {
    TreatmentType["Therapy"] = "Therapy";
    TreatmentType["Procedure"] = "Procedure";
    TreatmentType["Combined"] = "Combined";
})(TreatmentType || (exports.TreatmentType = TreatmentType = {}));
var TreatmentStatus;
(function (TreatmentStatus) {
    TreatmentStatus["Pending"] = "Pending";
    TreatmentStatus["InProgress"] = "In-Progress";
    TreatmentStatus["Completed"] = "Completed";
    TreatmentStatus["Cancelled"] = "Cancelled";
})(TreatmentStatus || (exports.TreatmentStatus = TreatmentStatus = {}));
var TreatmentBillingStatus;
(function (TreatmentBillingStatus) {
    TreatmentBillingStatus["Unbilled"] = "Unbilled";
    TreatmentBillingStatus["Draft"] = "Draft";
    TreatmentBillingStatus["Billed"] = "Billed";
    TreatmentBillingStatus["Paid"] = "Paid";
})(TreatmentBillingStatus || (exports.TreatmentBillingStatus = TreatmentBillingStatus = {}));
let TreatmentItem = class TreatmentItem {
    name;
    therapyId;
    subTherapyId;
    procedureId;
    subProcedureId;
    parentName;
    code;
    quantity;
    unitPrice;
    gst;
    discount;
    total;
};
exports.TreatmentItem = TreatmentItem;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], TreatmentItem.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'Therapy', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], TreatmentItem.prototype, "therapyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", String)
], TreatmentItem.prototype, "subTherapyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'Procedure', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], TreatmentItem.prototype, "procedureId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", String)
], TreatmentItem.prototype, "subProcedureId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", String)
], TreatmentItem.prototype, "parentName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", String)
], TreatmentItem.prototype, "code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 1 }),
    __metadata("design:type", Number)
], TreatmentItem.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], TreatmentItem.prototype, "unitPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], TreatmentItem.prototype, "gst", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], TreatmentItem.prototype, "discount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], TreatmentItem.prototype, "total", void 0);
exports.TreatmentItem = TreatmentItem = __decorate([
    (0, mongoose_1.Schema)({ _id: false, versionKey: false })
], TreatmentItem);
exports.TreatmentItemSchema = mongoose_1.SchemaFactory.createForClass(TreatmentItem);
let Treatment = class Treatment {
    mrn;
    patient;
    doctor;
    doctorName;
    consulting;
    type;
    category;
    items;
    therapist;
    therapistName;
    status;
    billingStatus;
    prescriptionDate;
    treatmentDate;
    notes;
    sessionNumber;
    parentTreatment;
    isRepeated;
    bill;
    billNo;
    paidAmount;
    paymentMethod;
    discount;
    completedAt;
    processedBy;
    isDeleted;
};
exports.Treatment = Treatment;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Treatment.prototype, "mrn", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Treatment.prototype, "patient", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null,
    }),
    __metadata("design:type", Object)
], Treatment.prototype, "doctor", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'Self' }),
    __metadata("design:type", String)
], Treatment.prototype, "doctorName", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: 'Consulting',
        required: false,
        default: null,
    }),
    __metadata("design:type", Object)
], Treatment.prototype, "consulting", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(TreatmentType),
        default: TreatmentType.Therapy,
    }),
    __metadata("design:type", String)
], Treatment.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'Therapy' }),
    __metadata("design:type", String)
], Treatment.prototype, "category", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.TreatmentItemSchema], default: [] }),
    __metadata("design:type", Array)
], Treatment.prototype, "items", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: 'Employee',
        required: false,
        default: null,
    }),
    __metadata("design:type", Object)
], Treatment.prototype, "therapist", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: '-' }),
    __metadata("design:type", String)
], Treatment.prototype, "therapistName", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(TreatmentStatus),
        default: TreatmentStatus.Pending,
    }),
    __metadata("design:type", String)
], Treatment.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(TreatmentBillingStatus),
        default: TreatmentBillingStatus.Unbilled,
    }),
    __metadata("design:type", String)
], Treatment.prototype, "billingStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Treatment.prototype, "prescriptionDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Treatment.prototype, "treatmentDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '' }),
    __metadata("design:type", String)
], Treatment.prototype, "notes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 1 }),
    __metadata("design:type", Number)
], Treatment.prototype, "sessionNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: 'Treatment',
        required: false,
        default: null,
    }),
    __metadata("design:type", Object)
], Treatment.prototype, "parentTreatment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Treatment.prototype, "isRepeated", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: 'Billing',
        required: false,
        default: null,
    }),
    __metadata("design:type", Object)
], Treatment.prototype, "bill", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '-' }),
    __metadata("design:type", String)
], Treatment.prototype, "billNo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Treatment.prototype, "paidAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: 'Cash' }),
    __metadata("design:type", String)
], Treatment.prototype, "paymentMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Treatment.prototype, "discount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Treatment.prototype, "completedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null,
    }),
    __metadata("design:type", Object)
], Treatment.prototype, "processedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Treatment.prototype, "isDeleted", void 0);
exports.Treatment = Treatment = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, versionKey: false })
], Treatment);
exports.TreatmentSchema = mongoose_1.SchemaFactory.createForClass(Treatment);
exports.TreatmentSchema.index({ patient: 1, isDeleted: 1 });
exports.TreatmentSchema.index({ parentTreatment: 1, isDeleted: 1 });
exports.TreatmentSchema.index({ status: 1, isDeleted: 1 });
exports.TreatmentSchema.index({ treatmentDate: -1, isDeleted: 1 });
exports.TreatmentSchema.index({ createdAt: -1 });
//# sourceMappingURL=treatment.schema.js.map