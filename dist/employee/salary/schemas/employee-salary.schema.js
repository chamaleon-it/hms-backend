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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeSalarySchema = exports.EmployeeSalary = exports.SalaryPaymentMethod = exports.SalaryPaymentStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const employee_schema_1 = require("../../schemas/employee.schema");
var SalaryPaymentStatus;
(function (SalaryPaymentStatus) {
    SalaryPaymentStatus["PENDING"] = "Pending";
    SalaryPaymentStatus["PAID"] = "Paid";
    SalaryPaymentStatus["PARTIALLY_PAID"] = "Partially Paid";
})(SalaryPaymentStatus || (exports.SalaryPaymentStatus = SalaryPaymentStatus = {}));
var SalaryPaymentMethod;
(function (SalaryPaymentMethod) {
    SalaryPaymentMethod["CASH"] = "Cash";
    SalaryPaymentMethod["BANK_TRANSFER"] = "Bank Transfer";
    SalaryPaymentMethod["UPI"] = "UPI";
    SalaryPaymentMethod["CHEQUE"] = "Cheque";
})(SalaryPaymentMethod || (exports.SalaryPaymentMethod = SalaryPaymentMethod = {}));
let EmployeeSalary = class EmployeeSalary {
    employee;
    month;
    year;
    basicPay;
    hourlySalary;
    hoursWorked;
    hourlyPayTotal;
    commission;
    commissionAmount;
    allowances;
    bonus;
    grossSalary;
    deductions;
    unpaidLeaves;
    unpaidLeaveDeduction;
    netSalary;
    paymentStatus;
    paidAmount;
    paymentMethod;
    paymentDate;
    transactionReference;
    note;
    isDeleted;
};
exports.EmployeeSalary = EmployeeSalary;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: employee_schema_1.Employee.name,
        required: true,
    }),
    __metadata("design:type", employee_schema_1.Employee)
], EmployeeSalary.prototype, "employee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], EmployeeSalary.prototype, "month", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], EmployeeSalary.prototype, "year", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], EmployeeSalary.prototype, "basicPay", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], EmployeeSalary.prototype, "hourlySalary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], EmployeeSalary.prototype, "hoursWorked", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], EmployeeSalary.prototype, "hourlyPayTotal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], EmployeeSalary.prototype, "commission", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], EmployeeSalary.prototype, "commissionAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], EmployeeSalary.prototype, "allowances", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], EmployeeSalary.prototype, "bonus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], EmployeeSalary.prototype, "grossSalary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], EmployeeSalary.prototype, "deductions", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], EmployeeSalary.prototype, "unpaidLeaves", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], EmployeeSalary.prototype, "unpaidLeaveDeduction", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], EmployeeSalary.prototype, "netSalary", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: SalaryPaymentStatus,
        default: SalaryPaymentStatus.PENDING,
    }),
    __metadata("design:type", String)
], EmployeeSalary.prototype, "paymentStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], EmployeeSalary.prototype, "paidAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: SalaryPaymentMethod }),
    __metadata("design:type", String)
], EmployeeSalary.prototype, "paymentMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], EmployeeSalary.prototype, "paymentDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], EmployeeSalary.prototype, "transactionReference", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], EmployeeSalary.prototype, "note", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], EmployeeSalary.prototype, "isDeleted", void 0);
exports.EmployeeSalary = EmployeeSalary = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, versionKey: false })
], EmployeeSalary);
exports.EmployeeSalarySchema = mongoose_1.SchemaFactory.createForClass(EmployeeSalary);
//# sourceMappingURL=employee-salary.schema.js.map