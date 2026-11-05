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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const patient_schema_1 = require("./schemas/patient.schema");
const mongoose_2 = __importStar(require("mongoose"));
const appointment_schema_1 = require("../appointments/schemas/appointment.schema");
let PatientsService = class PatientsService {
    patientModel;
    appointmentModel;
    constructor(patientModel, appointmentModel) {
        this.patientModel = patientModel;
        this.appointmentModel = appointmentModel;
    }
    escapeRegex(term) {
        return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    searchRegex(term) {
        return { $regex: this.escapeRegex(term), $options: 'i' };
    }
    matchesPatientQuery(patient, term) {
        return [
            patient.name,
            patient.mrn,
            patient.phoneNumber,
            patient.addressLine1,
            patient.addressLine2,
            patient.city,
            patient.district,
            patient.state,
            patient.pinCode,
            patient.country,
            patient.uhid,
        ].some((value) => String(value ?? '')
            .toLowerCase()
            .includes(term));
    }
    async generateUniqueMRN() {
        const lastRecord = await this.patientModel
            .findOne({ mrn: { $regex: /^\d{1,5}$/ } })
            .collation({ locale: 'en_US', numericOrdering: true })
            .sort({ mrn: -1 })
            .select('mrn')
            .lean()
            .exec();
        let nextNumber = 1;
        if (lastRecord && lastRecord.mrn) {
            nextNumber = parseInt(lastRecord.mrn, 10) + 1;
        }
        let mrn;
        let exists = true;
        do {
            mrn = nextNumber.toString().padStart(5, '0');
            const existing = await this.patientModel.exists({ mrn });
            exists = !!existing;
            if (exists)
                nextNumber++;
        } while (exists);
        return mrn;
    }
    async register(patientRegisterDto, createdBy) {
        const { age, month, ...rest } = patientRegisterDto;
        if (!rest.dateOfBirth && (age != null || month != null)) {
            const yrs = Number(age) || 0;
            const mths = Number(month) || 0;
            const today = new Date();
            const dob = new Date(today.getFullYear() - yrs, today.getMonth() - mths, today.getDate());
            rest.dateOfBirth = dob.toISOString();
        }
        if (!rest.mrn) {
            const mrn = await this.generateUniqueMRN();
            rest.mrn = mrn;
        }
        else {
            const mrn = await this.patientModel.exists({
                mrn: rest.mrn,
            });
            if (mrn) {
                throw new common_1.BadRequestException('MRN already exists');
            }
        }
        const patient = await this.patientModel.create({
            ...rest,
            createdBy,
        });
        return patient;
    }
    async getUniqueLocations(field, q) {
        if (!['city', 'district', 'state', 'pinCode', 'country'].includes(field)) {
            throw new common_1.BadRequestException('Invalid field');
        }
        const matchQuery = { [field]: { $nin: [null, ''] } };
        if (q && q.trim()) {
            matchQuery[field] = {
                ...this.searchRegex(q.trim()),
                $nin: [null, ''],
            };
        }
        const data = await this.patientModel.aggregate([
            { $match: matchQuery },
            { $group: { _id: `$${field}` } },
            { $limit: 20 },
            { $project: { _id: 0, value: '$_id' } },
            { $sort: { value: 1 } },
        ]);
        return data.map((d) => d.value).filter(Boolean);
    }
    async getPatient(getPatientsDto) {
        const { limit = 100, page = 1, query = '', gender, conditions, minAge, maxAge, doctor, status, from, to, consultedOnly, address, city, district, state, pincode, } = getPatientsDto;
        const skip = (page - 1) * limit;
        const filter = {};
        if (gender) {
            filter.gender = gender;
        }
        const now = new Date();
        const minA = Number(minAge);
        const maxA = Number(maxAge);
        if (Number.isFinite(minA) && Number.isFinite(maxA)) {
            if (minA > 0 || maxA < 100) {
                const minDate = new Date(now.getFullYear() - maxA - 1, now.getMonth(), now.getDate() + 1);
                const maxDate = new Date(now.getFullYear() - minA, now.getMonth(), now.getDate());
                filter.$expr = {
                    $and: [
                        {
                            $gte: [
                                {
                                    $convert: {
                                        input: '$dateOfBirth',
                                        to: 'date',
                                        onError: null,
                                        onNull: null,
                                    },
                                },
                                minDate,
                            ],
                        },
                        {
                            $lte: [
                                {
                                    $convert: {
                                        input: '$dateOfBirth',
                                        to: 'date',
                                        onError: null,
                                        onNull: null,
                                    },
                                },
                                maxDate,
                            ],
                        },
                    ],
                };
            }
        }
        if (doctor) {
            filter.doctor = new mongoose_2.default.Types.ObjectId(doctor);
        }
        if (conditions) {
            const parsedConditions = typeof conditions === 'string' ? JSON.parse(conditions) : conditions;
            if (parsedConditions.length > 0) {
                filter.conditions = { $in: parsedConditions };
            }
        }
        if (from && to) {
            filter.createdAt = {
                $gte: new Date(from),
                $lt: new Date(to),
            };
        }
        if (address) {
            const addressPattern = () => this.searchRegex(address.trim());
            filter.$and = filter.$and || [];
            filter.$and.push({
                $or: [
                    { addressLine1: addressPattern() },
                    { addressLine2: addressPattern() },
                    { city: addressPattern() },
                    { district: addressPattern() },
                    { state: addressPattern() },
                    { pinCode: addressPattern() },
                    { country: addressPattern() },
                ],
            });
        }
        if (city) {
            filter.city = this.searchRegex(city.trim());
        }
        if (district) {
            filter.district = this.searchRegex(district.trim());
        }
        if (state) {
            filter.state = this.searchRegex(state.trim());
        }
        if (pincode) {
            filter.pinCode = this.searchRegex(pincode.trim());
        }
        filter.status = status || { $ne: patient_schema_1.PatientStatus.DELETED };
        if (consultedOnly === 'true') {
            const appointmentMatch = { isDeleted: false };
            if (doctor) {
                appointmentMatch.doctor = new mongoose_2.default.Types.ObjectId(doctor);
            }
            const patientsWithAppts = await this.appointmentModel.distinct('patient', appointmentMatch);
            filter._id = { $in: patientsWithAppts };
        }
        const rawQuery = (getPatientsDto.query || getPatientsDto.q || '').trim();
        if (!rawQuery) {
            const [data, total] = await Promise.all([
                this.patientModel
                    .find(filter)
                    .skip(skip)
                    .limit(limit)
                    .populate('doctor')
                    .sort({ createdAt: -1 }),
                this.patientModel.countDocuments(filter),
            ]);
            return { data, total };
        }
        const searchTerm = rawQuery.toLowerCase();
        const searchPattern = () => this.searchRegex(rawQuery);
        const patients = await this.patientModel
            .find({
            ...filter,
            $or: [
                { name: searchPattern() },
                { mrn: searchPattern() },
                { phoneNumber: searchPattern() },
                { addressLine1: searchPattern() },
                { addressLine2: searchPattern() },
                { city: searchPattern() },
                { district: searchPattern() },
                { state: searchPattern() },
                { pinCode: searchPattern() },
                { country: searchPattern() },
                { uhid: searchPattern() },
            ],
        })
            .populate('doctor')
            .lean();
        const matchedPatients = patients.filter((patient) => this.matchesPatientQuery(patient, searchTerm));
        const getPriority = (patient) => {
            const name = (patient.name || '').toLowerCase().trim();
            const mrn = (patient.mrn || '').toLowerCase();
            const phone = (patient.phoneNumber || '').toLowerCase();
            const address = [
                patient.addressLine1,
                patient.addressLine2,
                patient.city,
                patient.district,
                patient.state,
                patient.pinCode,
                patient.country,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            const words = name.split(/\s+/);
            if (name === searchTerm || mrn === searchTerm || phone === searchTerm) {
                return 1;
            }
            if (name.startsWith(searchTerm)) {
                return 2;
            }
            if (words.some((word) => word.startsWith(searchTerm))) {
                return 3;
            }
            if (name.includes(searchTerm)) {
                return 4;
            }
            if (mrn.includes(searchTerm)) {
                return 5;
            }
            if (phone.includes(searchTerm)) {
                return 6;
            }
            if (address.includes(searchTerm)) {
                return 7;
            }
            return 10;
        };
        const sortedPatients = matchedPatients
            .map((patient) => ({
            ...patient,
            _searchPriority: getPriority(patient),
        }))
            .sort((a, b) => {
            if (a._searchPriority !== b._searchPriority) {
                return a._searchPriority - b._searchPriority;
            }
            return (new Date(b.createdAt || 0).getTime() -
                new Date(a.createdAt || 0).getTime());
        });
        return {
            data: sortedPatients.slice(skip, skip + Number(limit)),
            total: sortedPatients.length,
        };
    }
    async getSinglePatient(id) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException('Please provide a valid patient id');
        }
        const patient = await this.patientModel
            .findById(id)
            .populate('doctor', 'name specialization');
        return patient;
    }
    async statistics() {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dayIndex = (now.getDay() + 6) % 7;
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - dayIndex);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const facets = await this.patientModel
            .aggregate([
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    active: [
                        { $match: { status: patient_schema_1.PatientStatus.ACTIVE } },
                        { $count: 'count' },
                    ],
                    inactive: [
                        { $match: { status: patient_schema_1.PatientStatus.INACTIVE } },
                        { $count: 'count' },
                    ],
                    critical: [
                        { $match: { status: patient_schema_1.PatientStatus.CRITICAL } },
                        { $count: 'count' },
                    ],
                    discharged: [
                        { $match: { status: patient_schema_1.PatientStatus.DISCHARGED } },
                        { $count: 'count' },
                    ],
                    today: [
                        { $match: { createdAt: { $gte: startOfToday } } },
                        { $count: 'count' },
                    ],
                    thisWeek: [
                        { $match: { createdAt: { $gte: startOfWeek } } },
                        { $count: 'count' },
                    ],
                    thisMonth: [
                        {
                            $match: {
                                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                            },
                        },
                        { $count: 'count' },
                    ],
                    male: [{ $match: { gender: patient_schema_1.Gender.MALE } }, { $count: 'count' }],
                    female: [
                        { $match: { gender: patient_schema_1.Gender.FEMALE } },
                        { $count: 'count' },
                    ],
                },
            },
        ])
            .exec();
        const r = (facets[0] ?? {});
        const toNum = (arr) => arr && arr[0] ? arr[0].count : 0;
        return {
            total: toNum(r.total),
            active: toNum(r.active),
            inactive: toNum(r.inactive),
            critical: toNum(r.critical),
            discharged: toNum(r.discharged),
            today: toNum(r.today),
            thisWeek: toNum(r.thisWeek),
            thisMonth: toNum(r.thisMonth),
            male: toNum(r.male),
            female: toNum(r.female),
        };
    }
    async deleteBulkPatient(deleteBulkPatientDto) {
        const result = await this.patientModel.updateMany({
            _id: { $in: deleteBulkPatientDto.ids },
            status: { $ne: patient_schema_1.PatientStatus.DELETED },
        }, { status: patient_schema_1.PatientStatus.DELETED });
        if (result.matchedCount === 0)
            throw new common_1.NotFoundException('No patients found or all patients already deleted.');
    }
    async deletePatient(id) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException('Invalid patient ID provided.');
        }
        const patient = await this.patientModel.findOneAndUpdate({ _id: id, status: { $ne: patient_schema_1.PatientStatus.DELETED } }, { status: patient_schema_1.PatientStatus.DELETED }, { new: true });
        if (!patient) {
            throw new common_1.NotFoundException('Patient not found or already deleted.');
        }
        return patient;
    }
    async updatePatient(patientRegisterDto, patient) {
        const { age, month, ...rest } = patientRegisterDto;
        if (!rest.dateOfBirth && (age != null || month != null)) {
            const yrs = Number(age) || 0;
            const mths = Number(month) || 0;
            const today = new Date();
            const dob = new Date(today.getFullYear() - yrs, today.getMonth() - mths, today.getDate());
            rest.dateOfBirth = dob.toISOString();
        }
        const data = await this.patientModel.findByIdAndUpdate(patient, { $set: rest, $unset: { address: 1 } }, { new: true });
        if (!data) {
            throw new common_1.BadRequestException('Patient not found.');
        }
        return data;
    }
    async updatePatientRemarks(updateRemarksDto, patient) {
        const data = await this.patientModel.findByIdAndUpdate(patient, updateRemarksDto, { new: true });
        if (!data) {
            throw new common_1.BadRequestException('Patient not found.');
        }
        return data;
    }
    async checkPatientAlreadyExists(checkPatientAlreadyExistsDto) {
        const orConditions = [];
        if (checkPatientAlreadyExistsDto?.name) {
            orConditions.push({
                name: {
                    $regex: `^${checkPatientAlreadyExistsDto.name}$`,
                    $options: 'i',
                },
            });
        }
        if (checkPatientAlreadyExistsDto?.phoneNumber) {
            let phone = checkPatientAlreadyExistsDto.phoneNumber;
            phone = phone.replace(/\s+/g, '');
            phone = phone.replace(/^(\+91|91)/, '');
            phone = phone.replace(/\D/g, '');
            if (phone.length === 10) {
                const regexPattern = phone.split('').join('\\s*');
                orConditions.push({
                    phoneNumber: {
                        $regex: regexPattern,
                        $options: 'i',
                    },
                });
            }
        }
        if (checkPatientAlreadyExistsDto?.email) {
            orConditions.push({
                email: checkPatientAlreadyExistsDto.email.toLowerCase(),
            });
        }
        if (!orConditions.length)
            return null;
        const data = await this.patientModel
            .findOne({
            $or: orConditions,
        })
            .select('name phoneNumber email gender dateOfBirth blood mrn addressLine1 addressLine2 city district state pinCode country')
            .lean()
            .exec();
        return data;
    }
    async uploadPatientDocument(id, docData) {
        if (!mongoose_2.default.isValidObjectId(id)) {
            throw new common_1.BadRequestException('Invalid patient ID');
        }
        const patient = await this.patientModel.findById(id);
        if (!patient) {
            throw new common_1.NotFoundException('Patient not found');
        }
        if (!patient.documents) {
            patient.documents = [];
        }
        const index = patient.documents.findIndex((d) => d.name === docData.name);
        const newDoc = {
            name: docData.name,
            url: docData.url,
            originalName: docData.originalName || '',
            updatedAt: new Date(),
        };
        if (index >= 0) {
            patient.documents[index] = newDoc;
        }
        else {
            patient.documents.push(newDoc);
        }
        await patient.save();
        return patient;
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(patient_schema_1.Patient.name)),
    __param(1, (0, mongoose_1.InjectModel)(appointment_schema_1.Appointment.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], PatientsService);
//# sourceMappingURL=patients.service.js.map