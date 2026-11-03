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
exports.ConsultingsController = void 0;
const common_1 = require("@nestjs/common");
const consultings_service_1 = require("./consultings.service");
const consulting_dto_1 = require("./dto/consulting.dto");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const auth_guard_1 = require("../auth/auth.guard");
let ConsultingsController = class ConsultingsController {
    consultingsService;
    constructor(consultingsService) {
        this.consultingsService = consultingsService;
    }
    async create(consultingDto, user) {
        const data = await this.consultingsService.create(consultingDto, user.id);
        return {
            data,
            message: 'Consulting has been recorded successfully.',
        };
    }
    async getPatientConsultings(patientId) {
        const data = await this.consultingsService.getPatientConsultings(patientId);
        return {
            message: 'Patient consultation record retrieved',
            data,
        };
    }
    async updateTherapyStatus(id, completed) {
        const data = await this.consultingsService.updateTherapyStatus(id, completed ?? true);
        return {
            message: 'Therapy status updated successfully',
            data,
        };
    }
    async updateProcedureStatus(id, completed) {
        const data = await this.consultingsService.updateProcedureStatus(id, completed ?? true);
        return {
            message: 'Procedure status updated successfully',
            data,
        };
    }
};
exports.ConsultingsController = ConsultingsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [consulting_dto_1.ConsultingDto, Object]),
    __metadata("design:returntype", Promise)
], ConsultingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('/patient/:patientId'),
    __param(0, (0, common_1.Param)('patientId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ConsultingsController.prototype, "getPatientConsultings", null);
__decorate([
    (0, common_1.Patch)('/:id/therapy-status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('completed')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], ConsultingsController.prototype, "updateTherapyStatus", null);
__decorate([
    (0, common_1.Patch)('/:id/procedure-status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('completed')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], ConsultingsController.prototype, "updateProcedureStatus", null);
exports.ConsultingsController = ConsultingsController = __decorate([
    (0, common_1.Controller)('consultings'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [consultings_service_1.ConsultingsService])
], ConsultingsController);
//# sourceMappingURL=consultings.controller.js.map