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
exports.CreateTreatmentDto = exports.TreatmentItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const mongoose_1 = __importDefault(require("mongoose"));
const treatment_schema_1 = require("../schemas/treatment.schema");
class TreatmentItemDto {
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
}
exports.TreatmentItemDto = TreatmentItemDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Item name is required.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Item name cannot be empty.' }),
    __metadata("design:type", String)
], TreatmentItemDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], TreatmentItemDto.prototype, "therapyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TreatmentItemDto.prototype, "subTherapyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], TreatmentItemDto.prototype, "procedureId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TreatmentItemDto.prototype, "subProcedureId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TreatmentItemDto.prototype, "parentName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TreatmentItemDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TreatmentItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TreatmentItemDto.prototype, "unitPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TreatmentItemDto.prototype, "gst", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TreatmentItemDto.prototype, "discount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TreatmentItemDto.prototype, "total", void 0);
class CreateTreatmentDto {
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
    prescriptionDate;
    treatmentDate;
    treatmentDates;
    notes;
    discount;
}
exports.CreateTreatmentDto = CreateTreatmentDto;
__decorate([
    (0, class_validator_1.IsMongoId)({ message: 'Patient must be a valid ID.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Patient is required.' }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], CreateTreatmentDto.prototype, "patient", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], CreateTreatmentDto.prototype, "doctor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTreatmentDto.prototype, "doctorName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], CreateTreatmentDto.prototype, "consulting", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(treatment_schema_1.TreatmentType),
    __metadata("design:type", String)
], CreateTreatmentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTreatmentDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TreatmentItemDto),
    __metadata("design:type", Array)
], CreateTreatmentDto.prototype, "items", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], CreateTreatmentDto.prototype, "therapist", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTreatmentDto.prototype, "therapistName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(treatment_schema_1.TreatmentStatus),
    __metadata("design:type", String)
], CreateTreatmentDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], CreateTreatmentDto.prototype, "prescriptionDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], CreateTreatmentDto.prototype, "treatmentDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateTreatmentDto.prototype, "treatmentDates", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTreatmentDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateTreatmentDto.prototype, "discount", void 0);
//# sourceMappingURL=create-treatment.dto.js.map