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
exports.PatientSchema = exports.Patient = exports.PatientStatus = exports.Gender = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
var Gender;
(function (Gender) {
    Gender["MALE"] = "Male";
    Gender["FEMALE"] = "Female";
})(Gender || (exports.Gender = Gender = {}));
var PatientStatus;
(function (PatientStatus) {
    PatientStatus["ACTIVE"] = "Active";
    PatientStatus["INACTIVE"] = "Inactive";
    PatientStatus["CRITICAL"] = "Critical";
    PatientStatus["DISCHARGED"] = "Discharged";
    PatientStatus["DELETED"] = "Deleted";
})(PatientStatus || (exports.PatientStatus = PatientStatus = {}));
let Patient = class Patient {
    name;
    phoneNumber;
    email;
    gender;
    dateOfBirth;
    conditions;
    blood;
    allergies;
    insurance;
    insuranceValidity;
    uhid;
    emergencyContactNumber;
    addressLine1;
    addressLine2;
    city;
    district;
    state;
    pinCode;
    country;
    notes;
    createdBy;
    doctor;
    status;
    mrn;
    remarks;
    remarksDate;
    weight;
    documents;
};
exports.Patient = Patient;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Patient.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, trim: true }),
    __metadata("design:type", String)
], Patient.prototype, "phoneNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, lowercase: true, default: '' }),
    __metadata("design:type", String)
], Patient.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: Object.values(Gender) }),
    __metadata("design:type", String)
], Patient.prototype, "gender", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", String)
], Patient.prototype, "dateOfBirth", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: [], type: [String] }),
    __metadata("design:type", Array)
], Patient.prototype, "conditions", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        required: false,
        default: null,
    }),
    __metadata("design:type", Object)
], Patient.prototype, "blood", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false, default: null, trim: true }),
    __metadata("design:type", Object)
], Patient.prototype, "allergies", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Patient.prototype, "insurance", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Patient.prototype, "insuranceValidity", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Patient.prototype, "uhid", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Patient.prototype, "emergencyContactNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Patient.prototype, "addressLine1", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Patient.prototype, "addressLine2", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Patient.prototype, "city", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Patient.prototype, "district", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Patient.prototype, "state", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Patient.prototype, "pinCode", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Patient.prototype, "country", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Patient.prototype, "notes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], Patient.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null,
    }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], Patient.prototype, "doctor", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: Object.values(PatientStatus), default: PatientStatus.ACTIVE }),
    __metadata("design:type", String)
], Patient.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Patient.prototype, "mrn", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null, trim: true }),
    __metadata("design:type", String)
], Patient.prototype, "remarks", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null, type: Date }),
    __metadata("design:type", Date)
], Patient.prototype, "remarksDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Number)
], Patient.prototype, "weight", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                name: { type: String, required: true },
                url: { type: String, required: true },
                originalName: { type: String },
                updatedAt: { type: Date, default: Date.now },
            },
        ],
        default: [],
    }),
    __metadata("design:type", Array)
], Patient.prototype, "documents", void 0);
exports.Patient = Patient = __decorate([
    (0, mongoose_1.Schema)({ versionKey: false, timestamps: true })
], Patient);
exports.PatientSchema = mongoose_1.SchemaFactory.createForClass(Patient);
//# sourceMappingURL=patient.schema.js.map