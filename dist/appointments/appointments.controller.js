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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsController = void 0;
const common_1 = require("@nestjs/common");
const appointments_service_1 = require("./appointments.service");
const create_appointment_dto_1 = require("./dto/create-appointment.dto");
const auth_guard_1 = require("../auth/auth.guard");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const get_list_dto_1 = require("./dto/get-list.dto");
const mongoose_1 = __importDefault(require("mongoose"));
const update_status_dto_1 = require("./dto/update-status.dto");
let AppointmentsController = class AppointmentsController {
    appointmentsService;
    constructor(appointmentsService) {
        this.appointmentsService = appointmentsService;
    }
    async createAppointment(createAppointmentDto, user) {
        const data = await this.appointmentsService.createAppointment(createAppointmentDto, user.id);
        return {
            data,
            message: 'Appointment created successfully.',
        };
    }
    async getAppointments(getListDto, user) {
        const doctorFilter = getListDto.doctor ||
            (user.role === 'Doctor' ? user.id?.toString() : undefined);
        const data = await this.appointmentsService.getAppointments({
            query: getListDto.query,
            status: getListDto.status ? getListDto.status : [],
            date: getListDto.date || new Date().toString(),
            activeDate: getListDto.activeDate,
            doctor: doctorFilter,
        });
        return {
            data,
            message: 'Appointment retrieved successfully',
        };
    }
    async getSingleAppointment(id) {
        const data = await this.appointmentsService.getSingleAppointment(id);
        return {
            data,
            message: 'Single appointment is retrieved.',
        };
    }
    async getStatistics(user, doctor) {
        const doctorFilter = doctor || (user.role === 'Doctor' ? user.id?.toString() : undefined);
        const data = await this.appointmentsService.getStatistics(doctorFilter);
        return {
            data,
            message: 'Appointment statistics retrieved successfully',
        };
    }
    async calenderMonthly(user, date, doctor) {
        const doctorFilter = doctor || (user.role === 'Doctor' ? user.id?.toString() : undefined);
        const data = await this.appointmentsService.calenderMonthly(date || new Date().toString(), doctorFilter);
        return {
            data,
            message: 'Monthly calender fetched successfully',
        };
    }
    async calenderWeekly(user, date, startOfWeek, doctor) {
        const doctorFilter = doctor || (user.role === 'Doctor' ? user.id?.toString() : undefined);
        const queryDate = date || startOfWeek || new Date().toString();
        const data = await this.appointmentsService.calenderWeekly(queryDate, doctorFilter);
        return {
            message: 'Weekly calander fetched',
            data,
        };
    }
    async updateStatus(id, updateStatusDto) {
        const data = await this.appointmentsService.updateStatus(id, updateStatusDto);
        return {
            data,
            message: 'Appointment status is updated',
        };
    }
    async consultationCharge(patient, doctor, date) {
        const data = await this.appointmentsService.previewConsultationCharge({
            patient: patient || '',
            doctor: doctor || '',
            date: date || '',
        });
        return {
            data,
            message: 'Consultation charge retrieved successfully',
        };
    }
    async getBookedSlot(date, doctor) {
        const selectedDate = date ? new Date(date) : new Date();
        const data = await this.appointmentsService.getBookedSlot(selectedDate, doctor);
        return {
            data,
            message: 'Booked slot all retrieved successfully',
        };
    }
    async getPatientAppointment(patient) {
        const data = await this.appointmentsService.getPatientAppointment(patient);
        return {
            data,
            message: 'patient appointment are retrieved successfully',
        };
    }
    async getWalkInAppointment(doctor, date) {
        const data = await this.appointmentsService.getWalkInAppointment(doctor, date);
        return {
            data,
            message: 'walk-in appointment',
        };
    }
    async updateAppointment(createAppointmentDto, id) {
        const data = await this.appointmentsService.updateAppointment(createAppointmentDto, id);
        return {
            data,
            message: 'Appointment updated successfully.',
        };
    }
    async deleteAppointment(id) {
        const data = await this.appointmentsService.deleteAppointment(id);
        return {
            data,
            message: 'Appointment deleted successfully.',
        };
    }
    async recoverAppointment(id) {
        const data = await this.appointmentsService.recoverAppointment(id);
        return {
            data,
            message: 'Appointment recovered successfully.',
        };
    }
    async refundAppointment(id, user, body) {
        const data = await this.appointmentsService.refundAppointment(id, new mongoose_1.default.Types.ObjectId(user.id), body.reason);
        return {
            data,
            message: 'Appointment refunded successfully.',
        };
    }
    async markArrived(id) {
        const data = await this.appointmentsService.markArrived(id);
        return {
            data,
            message: 'Patient marked as arrived successfully.',
        };
    }
};
exports.AppointmentsController = AppointmentsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_appointment_dto_1.CreateAppointmentDto, Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "createAppointment", null);
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_list_dto_1.GetListDto, Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getAppointments", null);
__decorate([
    (0, common_1.Get)('single/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getSingleAppointment", null);
__decorate([
    (0, common_1.Get)('statistics'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Query)('doctor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)('calender-monthly'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('doctor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "calenderMonthly", null);
__decorate([
    (0, common_1.Get)('/calender/weekly'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('startOfWeek')),
    __param(3, (0, common_1.Query)('doctor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "calenderWeekly", null);
__decorate([
    (0, common_1.Patch)('update_status/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId, update_status_dto_1.UpdateStatusDto]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)('consultation-charge'),
    __param(0, (0, common_1.Query)('patient')),
    __param(1, (0, common_1.Query)('doctor')),
    __param(2, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "consultationCharge", null);
__decorate([
    (0, common_1.Get)('booked_slot'),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, common_1.Query)('doctor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getBookedSlot", null);
__decorate([
    (0, common_1.Get)('patient/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getPatientAppointment", null);
__decorate([
    (0, common_1.Get)('walk-in/:doctor'),
    __param(0, (0, common_1.Param)('doctor')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId, String]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "getWalkInAppointment", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_appointment_dto_1.CreateAppointmentDto, mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "updateAppointment", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "deleteAppointment", null);
__decorate([
    (0, common_1.Post)('recover/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "recoverAppointment", null);
__decorate([
    (0, common_1.Post)('refund/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId, Object, Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "refundAppointment", null);
__decorate([
    (0, common_1.Patch)('arrived/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "markArrived", null);
exports.AppointmentsController = AppointmentsController = __decorate([
    (0, common_1.Controller)('appointments'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [appointments_service_1.AppointmentsService])
], AppointmentsController);
//# sourceMappingURL=appointments.controller.js.map