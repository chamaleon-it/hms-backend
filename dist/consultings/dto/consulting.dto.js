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
exports.ConsultingDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const mongoose_1 = __importDefault(require("mongoose"));
const digestive_system_1 = require("../digestive-system");
class ConsultationNotesDto {
    presentHistory;
    pastHistory;
    diagnosis;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Present history must be a string or null.' }),
    __metadata("design:type", Object)
], ConsultationNotesDto.prototype, "presentHistory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Past history must be a string or null.' }),
    __metadata("design:type", Object)
], ConsultationNotesDto.prototype, "pastHistory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Diagnosis must be a string or null.' }),
    __metadata("design:type", Object)
], ConsultationNotesDto.prototype, "diagnosis", void 0);
class ExaminationNoteDto {
    hr;
    bp;
    spo2;
    temp;
    tempUnit;
    rs;
    cvs;
    pa;
    cns;
    le;
    otherNotes;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'HR must be a string or null.' }),
    __metadata("design:type", Object)
], ExaminationNoteDto.prototype, "hr", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'BP must be a string or null.' }),
    __metadata("design:type", Object)
], ExaminationNoteDto.prototype, "bp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'SpO2 must be a string or null.' }),
    __metadata("design:type", Object)
], ExaminationNoteDto.prototype, "spo2", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Temperature must be a string or null.' }),
    __metadata("design:type", Object)
], ExaminationNoteDto.prototype, "temp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ExaminationNoteDto.prototype, "tempUnit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'RS must be a string or null.' }),
    __metadata("design:type", Object)
], ExaminationNoteDto.prototype, "rs", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'CVS must be a string or null.' }),
    __metadata("design:type", Object)
], ExaminationNoteDto.prototype, "cvs", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'P/A must be a string or null.' }),
    __metadata("design:type", Object)
], ExaminationNoteDto.prototype, "pa", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'CNS must be a string or null.' }),
    __metadata("design:type", Object)
], ExaminationNoteDto.prototype, "cns", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'L/E must be a string or null.' }),
    __metadata("design:type", Object)
], ExaminationNoteDto.prototype, "le", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Other notes must be a string or null.' }),
    __metadata("design:type", Object)
], ExaminationNoteDto.prototype, "otherNotes", void 0);
class MedicineDto {
    name;
    referralName;
    isCustom;
    dosage;
    frequency;
    food;
    duration;
    quantity;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_o, val) => val !== null && val !== undefined && val !== ''),
    (0, class_transformer_1.Transform)(({ value }) => (value === '' ? null : value)),
    (0, class_validator_1.IsMongoId)({ message: 'Drug name must be a valid Mongo ID if provided.' }),
    __metadata("design:type", Object)
], MedicineDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MedicineDto.prototype, "referralName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MedicineDto.prototype, "isCustom", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Dosage is required and must be a string.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Dosage cannot be empty.' }),
    __metadata("design:type", String)
], MedicineDto.prototype, "dosage", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Frequency is required and must be a string.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Frequency cannot be empty.' }),
    __metadata("design:type", String)
], MedicineDto.prototype, "frequency", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Food is required and must be a string.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Food cannot be empty.' }),
    __metadata("design:type", String)
], MedicineDto.prototype, "food", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Duration is required and must be a string.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Duration cannot be empty.' }),
    __metadata("design:type", String)
], MedicineDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Quantity cannot be empty.' }),
    __metadata("design:type", Number)
], MedicineDto.prototype, "quantity", void 0);
class TestDto {
    name;
    date;
    lab;
    priority;
    panels;
}
__decorate([
    (0, class_validator_1.IsArray)({ message: 'Test names must be an array of strings.' }),
    (0, class_validator_1.ArrayNotEmpty)({ message: 'Tests array cannot be empty.' }),
    __metadata("design:type", Array)
], TestDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({}, { message: 'Test date must be a valid date.' }),
    __metadata("design:type", Date)
], TestDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => !value ||
        typeof value !== 'string' ||
        value.trim() === '' ||
        !mongoose_1.default.isValidObjectId(value)
        ? undefined
        : value),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], TestDto.prototype, "lab", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Priority is required and must be a string.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Priority cannot be empty.' }),
    __metadata("design:type", String)
], TestDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Panels must be an array of strings.' }),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], TestDto.prototype, "panels", void 0);
class MedicalParametersDto {
    sleep;
    bowelMovement;
    urineMovement;
    appetite;
    digestiveSystem;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], MedicalParametersDto.prototype, "sleep", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], MedicalParametersDto.prototype, "bowelMovement", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], MedicalParametersDto.prototype, "urineMovement", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], MedicalParametersDto.prototype, "appetite", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (0, digestive_system_1.normalizeDigestiveSystem)(value)),
    (0, class_validator_1.IsArray)({ message: 'Digestive system must be a list of values.' }),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Object)
], MedicalParametersDto.prototype, "digestiveSystem", void 0);
class ConsultingDto {
    consultationNotes;
    examinationNote;
    medicalParameters;
    medicines;
    therapy;
    therapyDates;
    therapyNotes;
    procedure;
    procedureDates;
    procedureNotes;
    advice;
    appointment;
    patient;
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
}
exports.ConsultingDto = ConsultingDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ConsultationNotesDto),
    __metadata("design:type", ConsultationNotesDto)
], ConsultingDto.prototype, "consultationNotes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => ExaminationNoteDto),
    __metadata("design:type", ExaminationNoteDto)
], ConsultingDto.prototype, "examinationNote", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => MedicalParametersDto),
    __metadata("design:type", MedicalParametersDto)
], ConsultingDto.prototype, "medicalParameters", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Medicines must be an array.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => MedicineDto),
    __metadata("design:type", Array)
], ConsultingDto.prototype, "medicines", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ConsultingDto.prototype, "therapy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], ConsultingDto.prototype, "therapyDates", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Therapy notes must be a string or null.' }),
    __metadata("design:type", Object)
], ConsultingDto.prototype, "therapyNotes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ConsultingDto.prototype, "procedure", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], ConsultingDto.prototype, "procedureDates", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Procedure notes must be a string or null.' }),
    __metadata("design:type", Object)
], ConsultingDto.prototype, "procedureNotes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Advice must be a string or null.' }),
    __metadata("design:type", Object)
], ConsultingDto.prototype, "advice", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)({ message: 'Appointment must be valid id.' }),
    __metadata("design:type", Object)
], ConsultingDto.prototype, "appointment", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)({ message: 'Patient must be a valid id' }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], ConsultingDto.prototype, "patient", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Follow up must be a valid date or null.' }),
    __metadata("design:type", Object)
], ConsultingDto.prototype, "followUp", void 0);
__decorate([
    (0, class_validator_1.IsArray)({ message: 'Test must be an array.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TestDto),
    __metadata("design:type", Array)
], ConsultingDto.prototype, "test", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConsultingDto.prototype, "consultationType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ConsultingDto.prototype, "chiefComplaints", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ConsultingDto.prototype, "lifestyle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ConsultingDto.prototype, "acupunctureAssessment", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ConsultingDto.prototype, "treatmentPlan", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ConsultingDto.prototype, "medicalHistoryDetails", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ConsultingDto.prototype, "acupunctureExamination", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ConsultingDto.prototype, "followUpDetails", void 0);
//# sourceMappingURL=consulting.dto.js.map