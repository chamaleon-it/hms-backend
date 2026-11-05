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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateBatchPayrollDto = exports.CreateSalaryDto = void 0;
const class_validator_1 = require("class-validator");
class CreateSalaryDto {
    employee;
    month;
    year;
    basicPay;
    hourlySalary;
    hoursWorked;
    commission;
    commissionAmount;
    allowances;
    bonus;
    deductions;
    unpaidLeaves;
    unpaidLeaveDeduction;
    note;
}
exports.CreateSalaryDto = CreateSalaryDto;
__decorate([
    (0, class_validator_1.IsMongoId)({ message: 'Employee ID must be a valid MongoDB ObjectId' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Employee ID is required' }),
    __metadata("design:type", String)
], CreateSalaryDto.prototype, "employee", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Month is required' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Month is required' }),
    __metadata("design:type", String)
], CreateSalaryDto.prototype, "month", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Year must be a number' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Year is required' }),
    __metadata("design:type", Number)
], CreateSalaryDto.prototype, "year", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalaryDto.prototype, "basicPay", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalaryDto.prototype, "hourlySalary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalaryDto.prototype, "hoursWorked", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalaryDto.prototype, "commission", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalaryDto.prototype, "commissionAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalaryDto.prototype, "allowances", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalaryDto.prototype, "bonus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalaryDto.prototype, "deductions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalaryDto.prototype, "unpaidLeaves", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateSalaryDto.prototype, "unpaidLeaveDeduction", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSalaryDto.prototype, "note", void 0);
class GenerateBatchPayrollDto {
    month;
    year;
    role;
}
exports.GenerateBatchPayrollDto = GenerateBatchPayrollDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Month is required' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Month is required' }),
    __metadata("design:type", String)
], GenerateBatchPayrollDto.prototype, "month", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Year must be a number' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Year is required' }),
    __metadata("design:type", Number)
], GenerateBatchPayrollDto.prototype, "year", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateBatchPayrollDto.prototype, "role", void 0);
//# sourceMappingURL=create-salary.dto.js.map