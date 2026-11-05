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
exports.EmployeeSchema = exports.Employee = exports.EmployeeRole = void 0;
const mongoose_1 = require("@nestjs/mongoose");
var EmployeeRole;
(function (EmployeeRole) {
    EmployeeRole["PHARMACIST"] = "Pharmacist";
    EmployeeRole["TECHNICIAN"] = "Technician";
    EmployeeRole["THERAPIST"] = "Therapist";
    EmployeeRole["RECEPTIONIST"] = "Receptionist";
    EmployeeRole["TELECALLER"] = "Telecaller";
    EmployeeRole["ACCOUNTANT"] = "Accountant";
    EmployeeRole["MEDIA_TEAM"] = "Media Team";
    EmployeeRole["CLEANING_STAFF"] = "Cleaning Staff";
    EmployeeRole["DOCTOR"] = "Doctor";
})(EmployeeRole || (exports.EmployeeRole = EmployeeRole = {}));
let Employee = class Employee {
    name;
    role;
    phone;
    email;
    gender;
    employeeId;
    qualification;
    designation;
    specialization;
    licenseNumber;
    address;
    status;
    isDeleted;
    inCharge;
    basicPay;
    hourlySalary;
    commission;
};
exports.Employee = Employee;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Employee.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: EmployeeRole }),
    __metadata("design:type", String)
], Employee.prototype, "role", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Employee.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Employee.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Employee.prototype, "gender", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Employee.prototype, "employeeId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Employee.prototype, "qualification", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Employee.prototype, "designation", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Employee.prototype, "specialization", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Employee.prototype, "licenseNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Employee.prototype, "address", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'Active' }),
    __metadata("design:type", String)
], Employee.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Employee.prototype, "isDeleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Employee.prototype, "inCharge", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Employee.prototype, "basicPay", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Employee.prototype, "hourlySalary", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Employee.prototype, "commission", void 0);
exports.Employee = Employee = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, versionKey: false })
], Employee);
exports.EmployeeSchema = mongoose_1.SchemaFactory.createForClass(Employee);
//# sourceMappingURL=employee.schema.js.map