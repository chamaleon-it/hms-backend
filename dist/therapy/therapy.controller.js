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
exports.TherapyController = void 0;
const common_1 = require("@nestjs/common");
const therapy_service_1 = require("./therapy.service");
const create_therapy_dto_1 = require("./dto/create-therapy.dto");
const update_therapy_dto_1 = require("./dto/update-therapy.dto");
const sub_therapy_dto_1 = require("./dto/sub-therapy.dto");
const auth_guard_1 = require("../auth/auth.guard");
let TherapyController = class TherapyController {
    therapyService;
    constructor(therapyService) {
        this.therapyService = therapyService;
    }
    async create(dto) {
        const data = await this.therapyService.createTherapy(dto);
        return {
            message: 'Therapy created successfully',
            data,
        };
    }
    async findAll(search, status) {
        const data = await this.therapyService.findAll(search, status);
        return {
            message: 'Therapies retrieved successfully',
            data,
        };
    }
    async findOne(id) {
        const data = await this.therapyService.findOne(id);
        return {
            message: 'Therapy retrieved successfully',
            data,
        };
    }
    async update(id, dto) {
        const data = await this.therapyService.updateTherapy(id, dto);
        return {
            message: 'Therapy updated successfully',
            data,
        };
    }
    async remove(id) {
        const data = await this.therapyService.softDeleteTherapy(id);
        return {
            message: 'Therapy deleted successfully',
            data,
        };
    }
    async addSubTherapy(id, dto) {
        const data = await this.therapyService.addSubTherapy(id, dto);
        return {
            message: 'Sub-therapy added successfully',
            data,
        };
    }
    async updateSubTherapy(id, subId, dto) {
        const data = await this.therapyService.updateSubTherapy(id, subId, dto);
        return {
            message: 'Sub-therapy updated successfully',
            data,
        };
    }
    async removeSubTherapy(id, subId) {
        const data = await this.therapyService.softDeleteSubTherapy(id, subId);
        return {
            message: 'Sub-therapy deleted successfully',
            data,
        };
    }
};
exports.TherapyController = TherapyController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_therapy_dto_1.CreateTherapyDto]),
    __metadata("design:returntype", Promise)
], TherapyController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TherapyController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TherapyController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_therapy_dto_1.UpdateTherapyDto]),
    __metadata("design:returntype", Promise)
], TherapyController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TherapyController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/sub-therapy'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sub_therapy_dto_1.SubTherapyDto]),
    __metadata("design:returntype", Promise)
], TherapyController.prototype, "addSubTherapy", null);
__decorate([
    (0, common_1.Patch)(':id/sub-therapy/:subId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('subId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TherapyController.prototype, "updateSubTherapy", null);
__decorate([
    (0, common_1.Delete)(':id/sub-therapy/:subId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('subId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TherapyController.prototype, "removeSubTherapy", null);
exports.TherapyController = TherapyController = __decorate([
    (0, common_1.Controller)('therapy'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [therapy_service_1.TherapyService])
], TherapyController);
//# sourceMappingURL=therapy.controller.js.map