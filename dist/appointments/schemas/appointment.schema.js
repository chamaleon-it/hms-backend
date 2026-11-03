"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentSchema = exports.Appointment = exports.AppointmentStatus = exports.AppointmentType = exports.AppointmentMethod = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
var AppointmentMethod;
(function (AppointmentMethod) {
    AppointmentMethod["IN_CLINIC"] = "In clinic";
    AppointmentMethod["VIDEO"] = "Video";
    AppointmentMethod["PHONE"] = "Phone";
})(AppointmentMethod || (exports.AppointmentMethod = AppointmentMethod = {}));
var AppointmentType;
(function (AppointmentType) {
    AppointmentType["NEW"] = "New";
    AppointmentType["FOLLOW_UP"] = "Follow up";
})(AppointmentType || (exports.AppointmentType = AppointmentType = {}));
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["UPCOMING"] = "Upcoming";
    AppointmentStatus["CONSULTED"] = "Consulted";
    AppointmentStatus["OBSERVATION"] = "Observation";
    AppointmentStatus["COMPLETED"] = "Completed";
    AppointmentStatus["NOT_SHOW"] = "Not show";
    AppointmentStatus["ADMIT"] = "Admit";
    AppointmentStatus["TEST"] = "Test";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
let Appointment = class Appointment {
    patient;
    doctor;
    createdBy;
    method;
    date;
    notes;
    internalNotes;
    type;
    status;
    isPaid;
    isDeleted;
    isRefunded;
    refundReason;
    hasConsultationFee;
    consultationValidUntil;
    tokenNumber;
    token;
    isArrived;
    cash;
    card;
    upi;
    discount;
};
exports.Appointment = Appointment;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'Patient' }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], Appointment.prototype, "patient", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], Appointment.prototype, "doctor", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], Appointment.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(AppointmentMethod),
        default: AppointmentMethod.IN_CLINIC,
    }),
    __metadata("design:type", String)
], Appointment.prototype, "method", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], Appointment.prototype, "date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], Appointment.prototype, "notes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], Appointment.prototype, "internalNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(AppointmentType),
        default: AppointmentType.NEW,
    }),
    __metadata("design:type", String)
], Appointment.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(AppointmentStatus),
        default: AppointmentStatus.UPCOMING,
    }),
    __metadata("design:type", String)
], Appointment.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: false,
    }),
    __metadata("design:type", Boolean)
], Appointment.prototype, "isPaid", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: false,
    }),
    __metadata("design:type", Boolean)
], Appointment.prototype, "isDeleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: false,
    }),
    __metadata("design:type", Boolean)
], Appointment.prototype, "isRefunded", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false, default: null }),
    __metadata("design:type", String)
], Appointment.prototype, "refundReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: true,
    }),
    __metadata("design:type", Boolean)
], Appointment.prototype, "hasConsultationFee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Appointment.prototype, "consultationValidUntil", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: false, default: null }),
    __metadata("design:type", Number)
], Appointment.prototype, "tokenNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false, default: null }),
    __metadata("design:type", String)
], Appointment.prototype, "token", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        default: false,
    }),
    __metadata("design:type", Boolean)
], Appointment.prototype, "isArrived", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Appointment.prototype, "cash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Appointment.prototype, "card", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Appointment.prototype, "upi", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Appointment.prototype, "discount", void 0);
exports.Appointment = Appointment = __decorate([
    (0, mongoose_1.Schema)({
        versionKey: false,
        timestamps: true,
    })
], Appointment);
exports.AppointmentSchema = mongoose_1.SchemaFactory.createForClass(Appointment);
//# sourceMappingURL=appointment.schema.js.map