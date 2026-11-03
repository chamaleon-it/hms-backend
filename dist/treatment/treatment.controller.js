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
exports.TreatmentController = void 0;
const common_1 = require("@nestjs/common");
const treatment_service_1 = require("./treatment.service");
const auth_guard_1 = require("../auth/auth.guard");
const create_treatment_dto_1 = require("./dto/create-treatment.dto");
const update_treatment_dto_1 = require("./dto/update-treatment.dto");
const process_treatment_dto_1 = require("./dto/process-treatment.dto");
const repeat_treatment_dto_1 = require("./dto/repeat-treatment.dto");
const get_treatments_dto_1 = require("./dto/get-treatments.dto");
let TreatmentController = class TreatmentController {
    treatmentService;
    constructor(treatmentService) {
        this.treatmentService = treatmentService;
    }
    async create(createTreatmentDto) {
        const data = await this.treatmentService.create(createTreatmentDto);
        return {
            message: 'Treatment order created successfully',
            data,
        };
    }
    async findAll(query) {
        return await this.treatmentService.findAll(query);
    }
    async getTimeline(id) {
        const data = await this.treatmentService.getTimeline(id);
        return {
            message: 'Treatment timeline retrieved successfully',
            data,
        };
    }
    async findOne(id) {
        const data = await this.treatmentService.findOne(id);
        return {
            message: 'Treatment details retrieved successfully',
            data,
        };
    }
    async update(id, updateTreatmentDto) {
        const data = await this.treatmentService.update(id, updateTreatmentDto);
        return {
            message: 'Treatment updated successfully',
            data,
        };
    }
    async processSession(id, processDto, req) {
        const userId = req?.user?._id || req?.user?.id;
        const result = await this.treatmentService.processSession(id, processDto, userId);
        return {
            message: 'Treatment session processed and billed successfully',
            data: result.treatment,
            bill: result.bill,
        };
    }
    async repeatSession(id, repeatDto, req) {
        const userId = req?.user?._id || req?.user?.id;
        const result = await this.treatmentService.repeatSession(id, repeatDto, userId);
        return {
            message: 'Treatment session repeated successfully',
            data: result.treatment,
            bill: result.bill,
        };
    }
    async remove(id) {
        return await this.treatmentService.delete(id);
    }
};
exports.TreatmentController = TreatmentController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_treatment_dto_1.CreateTreatmentDto]),
    __metadata("design:returntype", Promise)
], TreatmentController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_treatments_dto_1.GetTreatmentsDto]),
    __metadata("design:returntype", Promise)
], TreatmentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/timeline'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TreatmentController.prototype, "getTimeline", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TreatmentController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_treatment_dto_1.UpdateTreatmentDto]),
    __metadata("design:returntype", Promise)
], TreatmentController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/process'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, process_treatment_dto_1.ProcessTreatmentDto, Object]),
    __metadata("design:returntype", Promise)
], TreatmentController.prototype, "processSession", null);
__decorate([
    (0, common_1.Post)(':id/repeat'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, repeat_treatment_dto_1.RepeatTreatmentDto, Object]),
    __metadata("design:returntype", Promise)
], TreatmentController.prototype, "repeatSession", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TreatmentController.prototype, "remove", null);
exports.TreatmentController = TreatmentController = __decorate([
    (0, common_1.Controller)('treatment'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [treatment_service_1.TreatmentService])
], TreatmentController);
//# sourceMappingURL=treatment.controller.js.map