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
exports.CreateAppointmentDto = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const appointment_schema_1 = require("../schemas/appointment.schema");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateAppointmentDto {
    patient;
    doctor;
    method;
    date;
    notes;
    internalNotes;
    type;
    status;
    isPaid;
    isArrived;
    isWalkIn;
    cash;
    card;
    upi;
    discount;
}
exports.CreateAppointmentDto = CreateAppointmentDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)({ message: 'Patient must be a valid MongoDB ObjectId.' }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], CreateAppointmentDto.prototype, "patient", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)({ message: 'Doctor must be a valid MongoDB ObjectId.' }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], CreateAppointmentDto.prototype, "doctor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(appointment_schema_1.AppointmentMethod, {
        message: 'Method must be a valid appointment method.',
    }),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "method", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Date must be a valid ISO date string.' }),
    __metadata("design:type", Date)
], CreateAppointmentDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Notes must be a string.' }),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Internal notes must be a string.' }),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "internalNotes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(appointment_schema_1.AppointmentType, {
        message: 'Type must be a valid appointment type.',
    }),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(appointment_schema_1.AppointmentStatus, {
        message: 'Status must be a valid appointment status.',
    }),
    __metadata("design:type", String)
], CreateAppointmentDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'isPaid must be a boolean value.' }),
    __metadata("design:type", Boolean)
], CreateAppointmentDto.prototype, "isPaid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'isArrived must be a boolean value.' }),
    __metadata("design:type", Boolean)
], CreateAppointmentDto.prototype, "isArrived", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'isWalkIn must be a boolean value.' }),
    __metadata("design:type", Boolean)
], CreateAppointmentDto.prototype, "isWalkIn", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'Cash must be a number.' }),
    (0, class_validator_1.Min)(0, { message: 'Cash cannot be negative.' }),
    __metadata("design:type", Number)
], CreateAppointmentDto.prototype, "cash", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'Card must be a number.' }),
    (0, class_validator_1.Min)(0, { message: 'Card cannot be negative.' }),
    __metadata("design:type", Number)
], CreateAppointmentDto.prototype, "card", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'UPI must be a number.' }),
    (0, class_validator_1.Min)(0, { message: 'UPI cannot be negative.' }),
    __metadata("design:type", Number)
], CreateAppointmentDto.prototype, "upi", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({}, { message: 'Discount must be a number.' }),
    (0, class_validator_1.Min)(0, { message: 'Discount cannot be negative.' }),
    __metadata("design:type", Number)
], CreateAppointmentDto.prototype, "discount", void 0);
//# sourceMappingURL=create-appointment.dto.js.map