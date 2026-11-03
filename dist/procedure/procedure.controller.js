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
exports.ProcedureController = void 0;
const common_1 = require("@nestjs/common");
const procedure_service_1 = require("./procedure.service");
const create_procedure_dto_1 = require("./dto/create-procedure.dto");
const update_procedure_dto_1 = require("./dto/update-procedure.dto");
const sub_procedure_dto_1 = require("./dto/sub-procedure.dto");
const auth_guard_1 = require("../auth/auth.guard");
let ProcedureController = class ProcedureController {
    procedureService;
    constructor(procedureService) {
        this.procedureService = procedureService;
    }
    async create(dto) {
        const data = await this.procedureService.createProcedure(dto);
        return {
            message: 'Procedure created successfully',
            data,
        };
    }
    async findAll(search, status) {
        const data = await this.procedureService.findAll(search, status);
        return {
            message: 'Procedures retrieved successfully',
            data,
        };
    }
    async findOne(id) {
        const data = await this.procedureService.findOne(id);
        return {
            message: 'Procedure retrieved successfully',
            data,
        };
    }
    async update(id, dto) {
        const data = await this.procedureService.updateProcedure(id, dto);
        return {
            message: 'Procedure updated successfully',
            data,
        };
    }
    async remove(id) {
        const data = await this.procedureService.softDeleteProcedure(id);
        return {
            message: 'Procedure deleted successfully',
            data,
        };
    }
    async addSubProcedure(id, dto) {
        const data = await this.procedureService.addSubProcedure(id, dto);
        return {
            message: 'Sub-procedure added successfully',
            data,
        };
    }
    async updateSubProcedure(id, subId, dto) {
        const data = await this.procedureService.updateSubProcedure(id, subId, dto);
        return {
            message: 'Sub-procedure updated successfully',
            data,
        };
    }
    async removeSubProcedure(id, subId) {
        const data = await this.procedureService.softDeleteSubProcedure(id, subId);
        return {
            message: 'Sub-procedure deleted successfully',
            data,
        };
    }
};
exports.ProcedureController = ProcedureController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_procedure_dto_1.CreateProcedureDto]),
    __metadata("design:returntype", Promise)
], ProcedureController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProcedureController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProcedureController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_procedure_dto_1.UpdateProcedureDto]),
    __metadata("design:returntype", Promise)
], ProcedureController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProcedureController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/sub-procedure'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sub_procedure_dto_1.SubProcedureDto]),
    __metadata("design:returntype", Promise)
], ProcedureController.prototype, "addSubProcedure", null);
__decorate([
    (0, common_1.Patch)(':id/sub-procedure/:subId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('subId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ProcedureController.prototype, "updateSubProcedure", null);
__decorate([
    (0, common_1.Delete)(':id/sub-procedure/:subId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('subId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProcedureController.prototype, "removeSubProcedure", null);
exports.ProcedureController = ProcedureController = __decorate([
    (0, common_1.Controller)('procedure'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [procedure_service_1.ProcedureService])
], ProcedureController);
//# sourceMappingURL=procedure.controller.js.map