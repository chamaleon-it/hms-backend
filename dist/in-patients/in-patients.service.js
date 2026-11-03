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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InPatientsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const in_patient_schema_1 = require("./schemas/in-patient.schema");
const patient_schema_1 = require("../patients/schemas/patient.schema");
let InPatientsService = class InPatientsService {
    inPatientModel;
    patientModel;
    constructor(inPatientModel, patientModel) {
        this.inPatientModel = inPatientModel;
        this.patientModel = patientModel;
    }
    async create(createInPatientDto, user) {
        const existingActive = await this.inPatientModel
            .findOne({
            patientId: new mongoose_2.Types.ObjectId(createInPatientDto.patientId),
            status: { $ne: in_patient_schema_1.IPStatus.DISCHARGED },
        })
            .lean();
        if (existingActive) {
            throw new common_1.ConflictException(`Patient already admitted (IP: ${existingActive.admissionNumber}, Status: ${existingActive.status})`);
        }
        const admissionNumber = await this.nextAdmissionNumber();
        const newIP = new this.inPatientModel({
            ...createInPatientDto,
            admissionNumber,
            createdBy: user?._id,
            patientId: new mongoose_2.Types.ObjectId(createInPatientDto.patientId),
            doctorId: new mongoose_2.Types.ObjectId(createInPatientDto.doctorId),
        });
        return newIP.save();
    }
    async nextAdmissionNumber() {
        const last = await this.inPatientModel
            .findOne({ admissionNumber: { $type: 'string', $ne: '' } })
            .sort({ createdAt: -1 })
            .select('admissionNumber')
            .lean();
        let nextSeq = 1;
        if (last?.admissionNumber) {
            const parts = last.admissionNumber.split('-');
            const num = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(num))
                nextSeq = num + 1;
        }
        return 'IP-' + String(nextSeq).padStart(4, '0');
    }
    async addIpNote(id, noteData, user) {
        const ip = await this.inPatientModel.findById(id);
        if (!ip)
            throw new common_1.NotFoundException(`In-patient record #${id} not found`);
        ip.ipNotes.push({ ...noteData, recordedBy: user?._id });
        await ip.save();
        return { data: ip, message: 'Note added successfully' };
    }
    async findAll(query) {
        const filter = {};
        if (query.q) {
            const searchRegex = new RegExp(query.q, 'i');
            const matchingPatients = await this.patientModel
                .find({
                $or: [
                    { name: searchRegex },
                    { mrn: searchRegex },
                    { phoneNumber: searchRegex },
                ],
            })
                .select('_id')
                .lean();
            const patientIds = matchingPatients.map((p) => p._id);
            filter.$or = [
                { status: searchRegex },
                { admissionNumber: searchRegex },
                { ward: searchRegex },
                { room: searchRegex },
                { bed: searchRegex },
                { patientId: { $in: patientIds } },
            ];
        }
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const skip = (page - 1) * limit;
        const data = await this.inPatientModel
            .find(filter)
            .populate('patientId', 'name mrn gender dateOfBirth phoneNumber')
            .populate('doctorId', 'name specialization')
            .sort({ admissionDate: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
        const total = await this.inPatientModel.countDocuments(filter);
        return {
            message: 'In-patients retrieved successfully',
            data,
            total,
            page,
            limit,
        };
    }
    async findOne(id) {
        const ip = await this.inPatientModel
            .findById(id)
            .populate('patientId', 'name mrn gender dateOfBirth phoneNumber')
            .populate('doctorId', 'name specialization')
            .exec();
        if (!ip) {
            throw new common_1.NotFoundException(`In-patient record #${id} not found`);
        }
        return { data: ip, message: 'In-patient record retrieved' };
    }
    async update(id, updateInPatientDto, user) {
        const updateData = { ...updateInPatientDto, updatedBy: user?._id };
        if (updateInPatientDto.patientId) {
            updateData.patientId = new mongoose_2.Types.ObjectId(updateInPatientDto.patientId);
        }
        if (updateInPatientDto.doctorId) {
            updateData.doctorId = new mongoose_2.Types.ObjectId(updateInPatientDto.doctorId);
        }
        const updated = await this.inPatientModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .populate('patientId', 'name mrn')
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException(`In-patient record #${id} not found`);
        }
        return { data: updated, message: 'In-patient record updated successfully' };
    }
    async remove(id) {
        const deleted = await this.inPatientModel.findByIdAndDelete(id).exec();
        if (!deleted) {
            throw new common_1.NotFoundException(`In-patient record #${id} not found`);
        }
        return { data: deleted, message: 'In-patient record deleted successfully' };
    }
};
exports.InPatientsService = InPatientsService;
exports.InPatientsService = InPatientsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(in_patient_schema_1.InPatient.name)),
    __param(1, (0, mongoose_1.InjectModel)(patient_schema_1.Patient.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], InPatientsService);
//# sourceMappingURL=in-patients.service.js.map