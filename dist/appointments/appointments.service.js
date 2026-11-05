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
exports.AppointmentsService = void 0;
exports.safeRegex = safeRegex;
const common_1 = require("@nestjs/common");
const mongoose_1 = __importStar(require("mongoose"));
const mongoose_2 = require("@nestjs/mongoose");
const appointment_schema_1 = require("./schemas/appointment.schema");
const users_service_1 = require("../users/users.service");
const in_patient_schema_1 = require("../in-patients/schemas/in-patient.schema");
const billing_service_1 = require("../billing/billing.service");
const in_patients_service_1 = require("../in-patients/in-patients.service");
const consultation_validity_1 = require("./consultation-validity");
const appointment_payment_1 = require("./appointment-payment");
function getDoctorFirstNamePrefix(doctorName) {
    if (!doctorName)
        return 'DOC';
    const cleanName = doctorName
        .replace(/^(Dr\.|Dr|Prof\.|Prof|Mr\.|Mr|Mrs\.|Mrs|Ms\.|Ms)\s+/i, '')
        .trim();
    const parts = cleanName.split(/[\s.]+/).filter(Boolean);
    const firstName = parts[0] || 'DOC';
    return firstName.toUpperCase();
}
let AppointmentsService = class AppointmentsService {
    appointmentModel;
    inPatientModel;
    usersService;
    billingService;
    inPatientsService;
    constructor(appointmentModel, inPatientModel, usersService, billingService, inPatientsService) {
        this.appointmentModel = appointmentModel;
        this.inPatientModel = inPatientModel;
        this.usersService = usersService;
        this.billingService = billingService;
        this.inPatientsService = inPatientsService;
    }
    async createAppointment(createAppointmentDto, createdBy) {
        const visitDate = new Date(createAppointmentDto.date);
        let consultation = (0, consultation_validity_1.resolveVisitValidity)({ visitDate, priors: [] });
        try {
            const priors = await this.loadConsultationWindows(createAppointmentDto.patient, createAppointmentDto.doctor);
            consultation = (0, consultation_validity_1.resolveVisitValidity)({ visitDate, priors });
        }
        catch (error) {
            console.error('Failed to look up last appointment:', error);
        }
        const shouldBillConsultation = consultation.charge;
        let doctorUser = null;
        try {
            doctorUser = await this.usersService.getUserById(createAppointmentDto.doctor);
        }
        catch (error) {
            console.error('Failed to look up appointment doctor:', error);
        }
        const consultationFee = doctorUser?.consultationFee ?? 0;
        const payment = shouldBillConsultation
            ? (0, appointment_payment_1.resolveAppointmentPayment)(createAppointmentDto, consultationFee)
            : { cash: 0, card: 0, upi: 0, discount: 0, settled: true };
        let tokenNumber = 1;
        let token = 'DOC-01';
        try {
            const appDate = new Date(createAppointmentDto.date);
            const startOfDay = new Date(appDate);
            startOfDay.setUTCHours(0, 0, 0, 0);
            const endOfDay = new Date(appDate);
            endOfDay.setUTCHours(23, 59, 59, 999);
            const lastDoctorApp = await this.appointmentModel
                .findOne({
                doctor: createAppointmentDto.doctor,
                date: { $gte: startOfDay, $lte: endOfDay },
                isDeleted: { $ne: true },
            })
                .sort({ tokenNumber: -1, createdAt: -1 });
            if (lastDoctorApp &&
                typeof lastDoctorApp.tokenNumber === 'number' &&
                lastDoctorApp.tokenNumber > 0) {
                tokenNumber = lastDoctorApp.tokenNumber + 1;
            }
            else {
                const existingCount = await this.appointmentModel.countDocuments({
                    doctor: createAppointmentDto.doctor,
                    date: { $gte: startOfDay, $lte: endOfDay },
                    isDeleted: { $ne: true },
                });
                tokenNumber = existingCount + 1;
            }
            const prefix = getDoctorFirstNamePrefix(doctorUser?.name || '');
            token = `${prefix}-${String(tokenNumber).padStart(2, '0')}`;
        }
        catch (tokenErr) {
            console.error('Failed to generate appointment token:', tokenErr);
        }
        const isWalkInApp = Boolean(createAppointmentDto.isWalkIn ||
            createAppointmentDto.walkIn ||
            createAppointmentDto.isArrived === true ||
            createAppointmentDto.type === 'Walk-in');
        const isArrived = isWalkInApp
            ? true
            : (createAppointmentDto.isArrived ?? false);
        const appointment = await this.appointmentModel.create({
            ...createAppointmentDto,
            cash: payment.cash,
            card: payment.card,
            upi: payment.upi,
            discount: payment.discount,
            hasConsultationFee: shouldBillConsultation,
            consultationValidUntil: consultation.validUntil,
            tokenNumber,
            token,
            isArrived,
            createdBy,
        });
        try {
            if (shouldBillConsultation) {
                const createBillingDto = {
                    user: createdBy,
                    patient: appointment.patient,
                    doctor: appointment.doctor ?? null,
                    token: appointment.token,
                    tokenNumber: appointment.tokenNumber,
                    items: [
                        {
                            name: 'Consultation Fee',
                            quantity: 1,
                            unitPrice: consultationFee,
                            gst: 0,
                            discount: 0,
                            total: consultationFee,
                        },
                    ],
                    cash: payment.cash,
                    card: payment.card,
                    upi: payment.upi,
                    discount: payment.discount,
                    status: payment.settled ? 'Completed' : 'Draft',
                    billingCategory: 'Reception',
                };
                await this.billingService.generateBill(createBillingDto);
            }
        }
        catch (error) {
            console.error('Failed to create consultation fee bill for appointment:', error);
        }
        return appointment;
    }
    async previewConsultationCharge(input) {
        const visitDate = new Date(input.date);
        if (!input.patient || !input.doctor || Number.isNaN(visitDate.getTime())) {
            throw new common_1.BadRequestException('Patient, doctor, and a valid visit date are required.');
        }
        const priors = await this.loadConsultationWindows(input.patient, input.doctor);
        const consultation = (0, consultation_validity_1.resolveVisitValidity)({ visitDate, priors });
        let consultationFee = 0;
        if (consultation.charge) {
            try {
                const doctorUser = await this.usersService.getUserById(input.doctor);
                consultationFee = doctorUser?.consultationFee ?? 0;
            }
            catch (error) {
                console.error('Failed to look up appointment doctor:', error);
            }
        }
        return {
            charge: consultation.charge,
            validUntil: consultation.validUntil,
            consultationFee,
        };
    }
    async getAppointments({ query, status, date, activeDate, doctor, }) {
        let dateStr = date || new Date().toISOString().split('T')[0];
        if (dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0];
        }
        let startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        let endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
        if (isNaN(startOfDay.getTime())) {
            const todayStr = new Date().toISOString().split('T')[0];
            startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
            endOfDay = new Date(`${todayStr}T23:59:59.999Z`);
        }
        if (activeDate === 'Today') {
            const todayStr = new Date().toISOString().split('T')[0];
            startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
            endOfDay = new Date(`${todayStr}T23:59:59.999Z`);
        }
        if (activeDate === '7 days') {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
            const endDateObj = new Date(today);
            endDateObj.setDate(today.getDate() + 7);
            const endStr = endDateObj.toISOString().split('T')[0];
            endOfDay = new Date(`${endStr}T23:59:59.999Z`);
        }
        if (activeDate === '30 days') {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
            const endDateObj = new Date(today);
            endDateObj.setDate(today.getDate() + 30);
            const endStr = endDateObj.toISOString().split('T')[0];
            endOfDay = new Date(`${endStr}T23:59:59.999Z`);
        }
        const $match = {
            date: { $gte: startOfDay, $lte: endOfDay },
        };
        if (doctor && mongoose_1.default.isValidObjectId(doctor)) {
            $match.doctor = new mongoose_1.default.Types.ObjectId(doctor);
        }
        if (query && query.trim())
            $match.patientName = { $regex: new RegExp(safeRegex(query.trim()), 'i') };
        if (status?.length) {
            if (status.includes('Deleted')) {
                $match.isDeleted = true;
            }
            else {
                $match.isDeleted = false;
                $match.status = { $in: status };
            }
        }
        const list = await this.appointmentModel
            .aggregate([
            { $match },
            {
                $lookup: {
                    from: 'users',
                    localField: 'doctor',
                    foreignField: '_id',
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                email: 1,
                                phoneNumber: 1,
                                address: 1,
                                profilePic: 1,
                                qualification: 1,
                                specialization: 1,
                                department: 1,
                                designation: 1,
                                licenseNo: 1,
                                consultationFee: 1,
                            },
                        },
                    ],
                    as: 'doctor',
                },
            },
            { $unwind: { path: '$doctor', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'patients',
                    localField: 'patient',
                    foreignField: '_id',
                    as: 'patient',
                },
            },
            { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'appointments',
                    let: { pid: '$patient._id', curDate: '$date' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$patient', '$$pid'] },
                                        { $lte: ['$date', '$$curDate'] },
                                    ],
                                },
                            },
                        },
                        { $count: 'cnt' },
                    ],
                    as: 'visitCountArr',
                },
            },
            {
                $addFields: {
                    visitCount: { $ifNull: [{ $first: '$visitCountArr.cnt' }, 0] },
                },
            },
            { $project: { visitCountArr: 0 } },
            { $sort: { date: 1 } },
        ])
            .option({ allowDiskUse: true });
        const doctorCounters = {};
        const withTokens = list
            .map((item) => {
            const docId = item.doctor?._id?.toString() || 'unknown';
            doctorCounters[docId] = (doctorCounters[docId] || 0) + 1;
            const num = item.tokenNumber || doctorCounters[docId];
            const docName = item.doctor?.name || '';
            const prefix = getDoctorFirstNamePrefix(docName);
            const tokenStr = item.token || `${prefix}-${String(num).padStart(2, '0')}`;
            return {
                ...item,
                tokenNumber: num,
                token: tokenStr,
            };
        })
            .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));
        return this.attachConsultationValidUntil(withTokens);
    }
    async attachConsultationValidUntil(rows) {
        const patientIds = [
            ...new Set(rows.map((row) => row.patient?._id).filter((id) => id)),
        ];
        if (!patientIds.length)
            return rows;
        const priors = await this.loadConsultationWindows(patientIds);
        const corrected = [];
        for (const row of rows) {
            if (!row.patient?._id) {
                corrected.push(row);
                continue;
            }
            const patientId = String(row.patient._id);
            const doctorId = String(row.doctor?._id || row.doctor || '');
            const visits = priors.filter((visit) => visit.patientId === patientId && visit.doctorId === doctorId);
            const decision = (0, consultation_validity_1.resolveVisitValidity)({
                visitDate: new Date(row.date),
                visitId: String(row._id),
                priors: visits,
            });
            const charge = row.isRefunded ? false : decision.charge;
            const next = {
                ...row,
                hasConsultationFee: charge,
                consultationValidUntil: decision.validUntil,
            };
            corrected.push(next);
            await this.storeConsultationWindow(row, charge, decision.validUntil);
        }
        return corrected;
    }
    async loadConsultationWindows(patient, doctor) {
        const patientIds = Array.isArray(patient) ? patient : [patient];
        const query = {
            patient: Array.isArray(patient) ? { $in: patientIds } : patient,
            isRefunded: { $ne: true },
            isDeleted: { $ne: true },
        };
        if (doctor)
            query.doctor = doctor;
        const found = await this.appointmentModel
            .find(query)
            .select('_id patient doctor date hasConsultationFee consultationValidUntil')
            .lean();
        const wantedPatients = new Set(patientIds.map((id) => String(id)));
        const wantedDoctor = doctor ? String(doctor) : '';
        return (found || [])
            .map((visit) => ({
            id: String(visit._id),
            patientId: String(visit.patient),
            doctorId: String(visit.doctor),
            date: new Date(visit.date),
            hasConsultationFee: visit.hasConsultationFee !== false,
            consultationValidUntil: visit.consultationValidUntil
                ? new Date(visit.consultationValidUntil)
                : null,
        }))
            .filter((visit) => wantedPatients.has(visit.patientId) &&
            (!wantedDoctor || visit.doctorId === wantedDoctor));
    }
    async storeConsultationWindow(row, charge, validUntil) {
        if (!row?._id || typeof this.appointmentModel.updateOne !== 'function') {
            return;
        }
        const sameDay = !!row.consultationValidUntil &&
            (0, consultation_validity_1.clinicDayKey)(new Date(row.consultationValidUntil)) ===
                (0, consultation_validity_1.clinicDayKey)(validUntil);
        const sameCharge = (row.hasConsultationFee !== false) === charge;
        if (sameDay && (sameCharge || row.isRefunded))
            return;
        try {
            await this.appointmentModel.updateOne({ _id: row._id }, row.isRefunded
                ? { consultationValidUntil: validUntil }
                : { consultationValidUntil: validUntil, hasConsultationFee: charge });
        }
        catch (error) {
            console.error('Failed to store consultation Valid Upto:', error);
        }
    }
    async getStatistics(doctor) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(startOfToday);
        endOfToday.setHours(23, 59, 59, 999);
        const dayIndex = (now.getDay() + 6) % 7;
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - dayIndex);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const doctorFilter = {};
        if (doctor && mongoose_1.default.isValidObjectId(doctor)) {
            doctorFilter.doctor = new mongoose_1.default.Types.ObjectId(doctor);
        }
        const matchToday = {
            date: { $gte: startOfToday, $lte: endOfToday },
            isDeleted: false,
            ...doctorFilter,
        };
        const [results, thisWeek, thisMonth, total] = await Promise.all([
            this.appointmentModel
                .aggregate([
                { $match: matchToday },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
            ])
                .exec(),
            this.appointmentModel.countDocuments({
                date: { $gte: startOfWeek, $lte: endOfWeek },
                isDeleted: false,
                ...doctorFilter,
            }),
            this.appointmentModel.countDocuments({
                date: { $gte: startOfMonth, $lte: endOfMonth },
                isDeleted: false,
                ...doctorFilter,
            }),
            this.appointmentModel.countDocuments({
                isDeleted: false,
                ...doctorFilter,
            }),
        ]);
        const stats = {
            today: 0,
            thisWeek,
            thisMonth,
            total,
            upcoming: 0,
            consulted: 0,
            observation: 0,
            completed: 0,
            notShow: 0,
            test: 0,
            admit: 0,
        };
        stats.today = results.reduce((acc, r) => acc + r.count, 0);
        for (const r of results) {
            switch (r._id) {
                case appointment_schema_1.AppointmentStatus.UPCOMING:
                    stats.upcoming = r.count;
                    break;
                case appointment_schema_1.AppointmentStatus.CONSULTED:
                    stats.consulted = r.count;
                    break;
                case appointment_schema_1.AppointmentStatus.OBSERVATION:
                    stats.observation = r.count;
                    break;
                case appointment_schema_1.AppointmentStatus.COMPLETED:
                    stats.completed = r.count;
                    break;
                case appointment_schema_1.AppointmentStatus.NOT_SHOW:
                    stats.notShow = r.count;
                    break;
                case appointment_schema_1.AppointmentStatus.TEST:
                    stats.test = r.count;
                    break;
                case appointment_schema_1.AppointmentStatus.ADMIT:
                    stats.admit = r.count;
                    break;
            }
        }
        return stats;
    }
    async calenderMonthly(date, doctor) {
        let dateStr = date || new Date().toISOString().split('T')[0];
        if (dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0];
        }
        const parsedDate = new Date(`${dateStr}T00:00:00.000Z`);
        const now = !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
        const year = now.getUTCFullYear();
        const month = now.getUTCMonth();
        const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
        const filter = {
            date: { $gte: startDate, $lte: endDate },
            isDeleted: false,
        };
        if (doctor && mongoose_1.default.isValidObjectId(doctor)) {
            filter.doctor = new mongoose_1.default.Types.ObjectId(doctor);
        }
        const appointments = await this.appointmentModel
            .find(filter)
            .select('date patient type status')
            .sort({ date: 1 })
            .populate('patient', 'name mrn')
            .lean();
        const data = appointments.map((a) => ({
            ...a,
            date: a.date instanceof Date
                ? a.date.toISOString().split('T')[0]
                : new Date(a.date).toISOString().split('T')[0],
        }));
        return data;
    }
    async updateStatus(id, updateStatusDto) {
        const data = await this.appointmentModel.findByIdAndUpdate(id, { status: updateStatusDto.status }, { new: true });
        if (updateStatusDto.status === 'Observation' ||
            updateStatusDto.status === 'Admit') {
            const patientId = data?.patient;
            const doctorId = data?.doctor;
            if (patientId && doctorId) {
                const existingIP = await this.inPatientModel.findOne({
                    patientId: patientId.toString(),
                    status: { $ne: in_patient_schema_1.IPStatus.DISCHARGED },
                });
                if (!existingIP) {
                    await this.inPatientModel.create({
                        patientId: patientId.toString(),
                        doctorId: doctorId.toString(),
                        admissionNumber: await this.inPatientsService.nextAdmissionNumber(),
                        status: updateStatusDto.status === 'Observation'
                            ? in_patient_schema_1.IPStatus.OBSERVATION
                            : in_patient_schema_1.IPStatus.ADMITTED,
                        admissionDate: new Date(),
                    });
                }
            }
        }
        return data;
    }
    async getSingleAppointment(id) {
        if (!mongoose_1.default.isValidObjectId(id))
            throw new common_1.BadRequestException('id not valid');
        const data = await this.appointmentModel
            .findById(id)
            .lean()
            .populate('patient');
        if (!data) {
            throw new common_1.NotFoundException('Appointment is not found.');
        }
        return data;
    }
    async calenderWeekly(date, doctor) {
        let now = new Date();
        if (date) {
            const parsed = new Date(date.includes('T') ? date : `${date}T00:00:00.000Z`);
            if (!isNaN(parsed.getTime())) {
                now = parsed;
            }
        }
        const startOfWeek = new Date(now);
        startOfWeek.setUTCDate(now.getUTCDate() - now.getUTCDay());
        startOfWeek.setUTCHours(0, 0, 0, 0);
        const endOfWeek = new Date(now);
        endOfWeek.setUTCDate(now.getUTCDate() + (6 - now.getUTCDay()));
        endOfWeek.setUTCHours(23, 59, 59, 999);
        const filter = {
            date: { $gte: startOfWeek, $lte: endOfWeek },
            isDeleted: false,
        };
        if (doctor && mongoose_1.default.isValidObjectId(doctor)) {
            filter.doctor = new mongoose_1.default.Types.ObjectId(doctor);
        }
        const data = await this.appointmentModel
            .find(filter)
            .select('date endDate patient doctor type status visitCount notes method token tokenNumber')
            .populate('patient', 'name mrn')
            .populate('doctor', 'name')
            .lean();
        return data;
    }
    async getBookedSlot(date, doctor) {
        if (!mongoose_1.default.isValidObjectId(doctor))
            throw new common_1.BadRequestException('Doctor id is not valid, Please select a valid doctor id');
        let dateStr = typeof date === 'string' ? date : date.toISOString();
        if (dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0];
        }
        const startOfDay = new Date(Math.min(new Date(`${dateStr}T00:00:00.000Z`).getTime(), new Date(`${dateStr}T00:00:00.000+05:30`).getTime()));
        const endOfDay = new Date(Math.max(new Date(`${dateStr}T23:59:59.999Z`).getTime(), new Date(`${dateStr}T23:59:59.999+05:30`).getTime()));
        const $match = {
            date: { $gte: startOfDay, $lte: endOfDay },
            doctor,
            isDeleted: { $ne: true },
            status: { $nin: ['Cancelled', 'Canceled'] },
        };
        const data = await this.appointmentModel
            .find($match)
            .distinct('date')
            .lean();
        return data;
    }
    async getPatientAppointment(patient) {
        if (!mongoose_1.default.isValidObjectId(patient)) {
            throw new common_1.BadRequestException('Please provide a valid patient id');
        }
        const data = await this.appointmentModel
            .find({ patient })
            .populate('patient')
            .populate('doctor', 'name specialization')
            .sort({ date: -1 })
            .lean();
        return data;
    }
    async getWalkInAppointment(doctor, date) {
        if (!mongoose_1.default.isValidObjectId(doctor))
            throw new common_1.BadRequestException('Please provide a valid doctor id');
        const today = date ? new Date(date) : new Date();
        const availability = await this.usersService.getDoctorAvailability(doctor);
        const isAvailable = availability.days
            ?.map((d) => dayNameToIndex[d])
            ?.includes(today.getDay());
        if (isAvailable) {
            const alreadyBooked = await this.getBookedSlot(new Date(), doctor);
            return {
                alreadyBooked,
                nextAvailableDate: today,
            };
        }
        else {
            const nextAvailableDate = getNextAvailableDate(availability.days ?? [], today);
            const alreadyBooked = await this.getBookedSlot(nextAvailableDate, doctor);
            return {
                alreadyBooked,
                nextAvailableDate,
            };
        }
    }
    async updateAppointment(createAppointmentDto, id) {
        const data = await this.appointmentModel.findByIdAndUpdate(id, createAppointmentDto, { new: true });
        if (!data) {
            throw new common_1.BadRequestException('No appointment found');
        }
        return data;
    }
    async deleteAppointment(id) {
        const data = await this.appointmentModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        if (!data) {
            throw new common_1.BadRequestException('No appointment found');
        }
        return data;
    }
    async recoverAppointment(id) {
        const data = await this.appointmentModel.findByIdAndUpdate(id, { isDeleted: false }, { new: true });
        if (!data) {
            throw new common_1.BadRequestException('No appointment found');
        }
        return data;
    }
    async refundAppointment(id, userId, reason) {
        const appointment = await this.appointmentModel.findById(id);
        if (!appointment) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        if (appointment.isRefunded) {
            throw new common_1.BadRequestException('This appointment has already been refunded');
        }
        const doctorUser = await this.usersService.getUserById(appointment.doctor);
        const consultationFee = doctorUser?.consultationFee ?? 0;
        const refundBill = await this.billingService.generateBill({
            user: userId,
            patient: appointment.patient,
            doctor: appointment.doctor ?? null,
            items: [
                {
                    name: 'Consultation Fee Refund',
                    quantity: 1,
                    unitPrice: consultationFee,
                    gst: 0,
                    discount: 0,
                    total: consultationFee,
                },
            ],
            cash: consultationFee,
            card: 0,
            upi: 0,
            discount: 0,
            transactionType: 'Refund',
            billingCategory: 'Reception',
            status: 'Completed',
            note: reason || undefined,
        });
        appointment.isRefunded = true;
        appointment.hasConsultationFee = false;
        if (reason)
            appointment.refundReason = reason;
        await appointment.save();
        return {
            appointment,
            bill: refundBill,
        };
    }
    async markArrived(id) {
        const appointment = await this.appointmentModel.findByIdAndUpdate(id, { isArrived: true }, { new: true });
        if (!appointment) {
            throw new common_1.NotFoundException('Appointment not found');
        }
        return appointment;
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(appointment_schema_1.Appointment.name)),
    __param(1, (0, mongoose_2.InjectModel)(in_patient_schema_1.InPatient.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        mongoose_1.Model,
        users_service_1.UsersService,
        billing_service_1.BillingService,
        in_patients_service_1.InPatientsService])
], AppointmentsService);
function safeRegex(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
const dayNameToIndex = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
};
function getNextAvailableDate(availableDays, today = new Date()) {
    const todayIndex = today.getDay();
    const availableIndices = availableDays.map((d) => dayNameToIndex[d]);
    const daysToAdd = availableIndices
        .map((day) => (day - todayIndex + 7) % 7)
        .filter((diff) => diff > 0)
        .sort((a, b) => a - b)[0] ?? 7;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    return nextDate;
}
//# sourceMappingURL=appointments.service.js.map