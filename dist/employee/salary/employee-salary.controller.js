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
exports.EmployeeSalaryController = void 0;
const common_1 = require("@nestjs/common");
const employee_salary_service_1 = require("./employee-salary.service");
const create_salary_dto_1 = require("./dto/create-salary.dto");
const update_salary_dto_1 = require("./dto/update-salary.dto");
const pay_salary_dto_1 = require("./dto/pay-salary.dto");
const auth_guard_1 = require("../../auth/auth.guard");
let EmployeeSalaryController = class EmployeeSalaryController {
    salaryService;
    constructor(salaryService) {
        this.salaryService = salaryService;
    }
    async create(createSalaryDto) {
        const data = await this.salaryService.create(createSalaryDto);
        return { message: 'Salary slip created successfully', data };
    }
    async generateBatch(dto) {
        const data = await this.salaryService.generateBatch(dto);
        return { message: data.message, data };
    }
    async findAll(month, year, employeeId, role, status, search) {
        const data = await this.salaryService.findAll(month, year, employeeId, role, status, search);
        return { message: 'Salary records retrieved successfully', data };
    }
    async getUnpaidLeaves(employeeId, month, year) {
        const days = await this.salaryService.getApprovedUnpaidLeaveDays(employeeId, month, Number(year) || new Date().getFullYear());
        return { data: { unpaidLeaves: days } };
    }
    async getStats(month, year) {
        const data = await this.salaryService.getStats(month, year);
        return { message: 'Salary stats retrieved successfully', data };
    }
    async findOne(id) {
        const data = await this.salaryService.findOne(id);
        return { message: 'Salary record retrieved successfully', data };
    }
    async paySalary(id, paySalaryDto) {
        const data = await this.salaryService.paySalary(id, paySalaryDto);
        return { message: 'Salary payout processed successfully', data };
    }
    async update(id, updateSalaryDto) {
        const data = await this.salaryService.update(id, updateSalaryDto);
        return { message: 'Salary record updated successfully', data };
    }
    async remove(id) {
        const data = await this.salaryService.softDelete(id);
        return { message: 'Salary record deleted successfully', data };
    }
};
exports.EmployeeSalaryController = EmployeeSalaryController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_salary_dto_1.CreateSalaryDto]),
    __metadata("design:returntype", Promise)
], EmployeeSalaryController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('generate-batch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_salary_dto_1.GenerateBatchPayrollDto]),
    __metadata("design:returntype", Promise)
], EmployeeSalaryController.prototype, "generateBatch", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __param(2, (0, common_1.Query)('employeeId')),
    __param(3, (0, common_1.Query)('role')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String, String, String, String]),
    __metadata("design:returntype", Promise)
], EmployeeSalaryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('unpaid-leaves'),
    __param(0, (0, common_1.Query)('employeeId')),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], EmployeeSalaryController.prototype, "getUnpaidLeaves", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Query)('month')),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], EmployeeSalaryController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeeSalaryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/pay'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pay_salary_dto_1.PaySalaryDto]),
    __metadata("design:returntype", Promise)
], EmployeeSalaryController.prototype, "paySalary", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_salary_dto_1.UpdateSalaryDto]),
    __metadata("design:returntype", Promise)
], EmployeeSalaryController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmployeeSalaryController.prototype, "remove", null);
exports.EmployeeSalaryController = EmployeeSalaryController = __decorate([
    (0, common_1.Controller)('employee-salary'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [employee_salary_service_1.EmployeeSalaryService])
], EmployeeSalaryController);
//# sourceMappingURL=employee-salary.controller.js.map