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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InPatientSchema = exports.InPatient = exports.IpNoteSchema = exports.IpNote = exports.IPStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../users/schemas/user.schema");
const patient_schema_1 = require("../../patients/schemas/patient.schema");
var IPStatus;
(function (IPStatus) {
    IPStatus["ADMITTED"] = "Admitted";
    IPStatus["OBSERVATION"] = "Under Observation";
    IPStatus["SURGERY"] = "Surgery";
    IPStatus["DISCHARGED"] = "Discharged";
})(IPStatus || (exports.IPStatus = IPStatus = {}));
let IpNote = class IpNote {
    temp;
    tempUnit;
    bp;
    hr;
    spo2;
    rr;
    weight;
    note;
    recordedBy;
};
exports.IpNote = IpNote;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], IpNote.prototype, "temp", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], IpNote.prototype, "tempUnit", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], IpNote.prototype, "bp", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], IpNote.prototype, "hr", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], IpNote.prototype, "spo2", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], IpNote.prototype, "rr", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], IpNote.prototype, "weight", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], IpNote.prototype, "note", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", user_schema_1.User)
], IpNote.prototype, "recordedBy", void 0);
exports.IpNote = IpNote = __decorate([
    (0, mongoose_1.Schema)({ _id: true, timestamps: true })
], IpNote);
exports.IpNoteSchema = mongoose_1.SchemaFactory.createForClass(IpNote);
let InPatient = class InPatient {
    patientId;
    admissionNumber;
    doctorId;
    room;
    ward;
    bed;
    diagnosis;
    notes;
    admissionDate;
    dischargeDate;
    status;
    ipNotes;
    createdBy;
    updatedBy;
};
exports.InPatient = InPatient;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Patient', required: true }),
    __metadata("design:type", patient_schema_1.Patient)
], InPatient.prototype, "patientId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], InPatient.prototype, "admissionNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", user_schema_1.User)
], InPatient.prototype, "doctorId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], InPatient.prototype, "room", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], InPatient.prototype, "ward", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], InPatient.prototype, "bed", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], InPatient.prototype, "diagnosis", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], InPatient.prototype, "notes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: true, default: Date.now }),
    __metadata("design:type", Date)
], InPatient.prototype, "admissionDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], InPatient.prototype, "dischargeDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: IPStatus, default: IPStatus.ADMITTED }),
    __metadata("design:type", String)
], InPatient.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.IpNoteSchema], default: [] }),
    __metadata("design:type", Array)
], InPatient.prototype, "ipNotes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", user_schema_1.User)
], InPatient.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", user_schema_1.User)
], InPatient.prototype, "updatedBy", void 0);
exports.InPatient = InPatient = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], InPatient);
exports.InPatientSchema = mongoose_1.SchemaFactory.createForClass(InPatient);
//# sourceMappingURL=in-patient.schema.js.map