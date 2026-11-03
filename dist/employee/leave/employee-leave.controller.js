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
exports.EmployeeLeaveController = void 0;
const common_1 = require("@nestjs/common");
const employee_leave_service_1 = require("./employee-leave.service");
const create_leave_dto_1 = require("./dto/create-leave.dto");
const update_leave_dto_1 = require("./dto/update-leave.dto");
const auth_guard_1 = require("../../auth/auth.guard");
let EmployeeLeaveController = class EmployeeLeaveController {
    leaveService;
    constructor(leaveService) {
        this.leaveService = leaveService;
    }
    async create(createLeaveDto) {
        const data = await this.leaveService.create(createLeaveDto);
        return { message: 'Leave application submitted successfully', data };
    }
    async findAll(search, status, employeeId, role, month, year) {
        const data = await this.leaveService.findAll(search, status, employeeId, role, month, year);
        return { message: 'Leave records retrieved successfully', data };
    }
    async getStats(year, month) {
        const data = await this.leaveService.getStats(year, month);
        return { message: 'Leave stats retrieved successfully', data };
    }
    async findOne(id) {
        const data = await this.leaveService.findOne(id);
        return { message: 'Leave record retrieved successfully', data };
    }
    async updateStatus(id, dto) {
        const data = await this.leaveService.updateStatus(id, dto);
        return { message: `Leave status updated to ${dto.status}`, data };
    }
    async update(id, updateLeaveDto) {
        const data = await this.leaveService.update(id, updateLeaveDto);
        return { message: 'Leave record updated successfully', data };
    }
    async remove(id) {
        const data = await this.leaveService.softDelete(id);
        return { message: 'Leave record deleted successfully', data };
    }
};
exports.EmployeeLeaveController = EmployeeLeaveController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_leave_dto_1.CreateLeaveDto]),
    __metadata("design:returntype", Promise)
], EmployeeLeaveController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('employeeId')),
    __param(3, (0, common_1.Query)('role')),
    __param(4, (0, common_1.Query)('month')),
    __param(5, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], EmployeeLeaveController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], EmployeeLeaveController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeeLeaveController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_leave_dto_1.UpdateLeaveStatusDto]),
    __metadata("design:returntype", Promise)
], EmployeeLeaveController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_leave_dto_1.UpdateLeaveDto]),
    __metadata("design:returntype", Promise)
], EmployeeLeaveController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeeLeaveController.prototype, "remove", null);
exports.EmployeeLeaveController = EmployeeLeaveController = __decorate([
    (0, common_1.Controller)('employee-leave'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [employee_leave_service_1.EmployeeLeaveService])
], EmployeeLeaveController);
//# sourceMappingURL=employee-leave.controller.js.map