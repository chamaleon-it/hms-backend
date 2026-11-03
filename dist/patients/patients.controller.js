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
exports.PatientsController = void 0;
const common_1 = require("@nestjs/common");
const patients_service_1 = require("./patients.service");
const patient_register_dto_1 = require("./dto/patient-register.dto");
const auth_guard_1 = require("../auth/auth.guard");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const get_patients_dto_1 = require("./dto/get-patients.dto");
const mongoose_1 = __importDefault(require("mongoose"));
const delete_bulk_patient_dto_1 = require("./dto/delete-bulk-patient.dto");
const update_remarks_dto_1 = require("./dto/update-remarks.dto");
const check_patient_already_exists_dto_1 = require("./dto/check-patient-already-exists.dto");
let PatientsController = class PatientsController {
    patientsService;
    constructor(patientsService) {
        this.patientsService = patientsService;
    }
    async register(patientRegisterDto, user) {
        const data = await this.patientsService.register(patientRegisterDto, user.id);
        return {
            data,
            message: 'Patient register successfully.',
        };
    }
    async getPatient(getPatientsDto) {
        const { data, total } = await this.patientsService.getPatient(getPatientsDto);
        return {
            data,
            total,
            message: 'All Patient data are retrieved successfully',
        };
    }
    async getSinglePatient(id) {
        const data = await this.patientsService.getSinglePatient(id);
        return {
            data,
            message: 'Patient data retrieved successfully',
        };
    }
    async getUniqueLocations(field, q) {
        const data = await this.patientsService.getUniqueLocations(field, q);
        return {
            data,
            message: 'Unique locations retrieved successfully',
        };
    }
    async statistics() {
        const data = await this.patientsService.statistics();
        return {
            data,
            message: 'Patient statistics retrieved successfully',
        };
    }
    async deleteBulkPatient(deleteBulkPatientDto) {
        const data = await this.patientsService.deleteBulkPatient(deleteBulkPatientDto);
        return {
            data,
            message: 'Selected patients were deleted successfully',
        };
    }
    async deletePatient(id) {
        const data = await this.patientsService.deletePatient(id);
        return {
            data,
            message: 'Patient is deleted successfully',
        };
    }
    async updatePatientRemarks(updateRemarksDto, patient) {
        updateRemarksDto.remarksDate = new Date();
        const data = await this.patientsService.updatePatientRemarks(updateRemarksDto, patient);
        return {
            data,
            message: 'Patient remarks is updated successfully',
        };
    }
    async updatePatient(patientRegisterDto, patient) {
        const data = await this.patientsService.updatePatient(patientRegisterDto, patient);
        return {
            data,
            message: 'Patient details is updated successfully',
        };
    }
    async uploadPatientDocument(id, dto) {
        const data = await this.patientsService.uploadPatientDocument(id, dto);
        return {
            data,
            message: 'Patient document updated successfully',
        };
    }
    async checkPatientAlreadyExists(checkPatientAlreadyExistsDto) {
        const data = await this.patientsService.checkPatientAlreadyExists(checkPatientAlreadyExistsDto);
        return {
            data: {
                isPatientAlreadyExists: Boolean(data),
                patient: data,
            },
            message: data ? 'Patient already exists' : 'Patient does not exist',
        };
    }
};
exports.PatientsController = PatientsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [patient_register_dto_1.PatientRegisterDto, Object]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "register", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_patients_dto_1.GetPatientsDto]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "getPatient", null);
__decorate([
    (0, common_1.Get)('single/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "getSinglePatient", null);
__decorate([
    (0, common_1.Get)('unique-locations'),
    __param(0, (0, common_1.Query)('field')),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "getUniqueLocations", null);
__decorate([
    (0, common_1.Get)('statistics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "statistics", null);
__decorate([
    (0, common_1.Delete)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [delete_bulk_patient_dto_1.DeleteBulkPatientDto]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "deleteBulkPatient", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "deletePatient", null);
__decorate([
    (0, common_1.Patch)('remarks/:id'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_remarks_dto_1.UpdateRemarksDto, mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "updatePatientRemarks", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [patient_register_dto_1.PatientRegisterDto, mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "updatePatient", null);
__decorate([
    (0, common_1.Patch)('document/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId, Object]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "uploadPatientDocument", null);
__decorate([
    (0, common_1.Get)('patient_already_exists'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [check_patient_already_exists_dto_1.CheckPatientAlreadyExistsDto]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "checkPatientAlreadyExists", null);
exports.PatientsController = PatientsController = __decorate([
    (0, common_1.Controller)('patients'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [patients_service_1.PatientsService])
], PatientsController);
//# sourceMappingURL=patients.controller.js.map