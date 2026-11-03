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
exports.EmployeeLeaveSchema = exports.EmployeeLeave = exports.LeaveStatus = exports.LeaveType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const employee_schema_1 = require("../../schemas/employee.schema");
var LeaveType;
(function (LeaveType) {
    LeaveType["CASUAL"] = "Casual Leave";
    LeaveType["SICK"] = "Sick Leave";
    LeaveType["EARNED"] = "Earned Leave";
    LeaveType["MATERNITY_PATERNITY"] = "Maternity / Paternity Leave";
    LeaveType["UNPAID"] = "Unpaid Leave";
    LeaveType["OTHER"] = "Other";
})(LeaveType || (exports.LeaveType = LeaveType = {}));
var LeaveStatus;
(function (LeaveStatus) {
    LeaveStatus["PENDING"] = "Pending";
    LeaveStatus["APPROVED"] = "Approved";
    LeaveStatus["REJECTED"] = "Rejected";
    LeaveStatus["CANCELLED"] = "Cancelled";
})(LeaveStatus || (exports.LeaveStatus = LeaveStatus = {}));
let EmployeeLeave = class EmployeeLeave {
    employee;
    leaveType;
    startDate;
    endDate;
    daysCount;
    reason;
    status;
    appliedDate;
    approvedBy;
    approvalNote;
    isDeleted;
};
exports.EmployeeLeave = EmployeeLeave;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: employee_schema_1.Employee.name,
        required: true,
    }),
    __metadata("design:type", employee_schema_1.Employee)
], EmployeeLeave.prototype, "employee", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: LeaveType, default: LeaveType.CASUAL }),
    __metadata("design:type", String)
], EmployeeLeave.prototype, "leaveType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], EmployeeLeave.prototype, "startDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], EmployeeLeave.prototype, "endDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 1 }),
    __metadata("design:type", Number)
], EmployeeLeave.prototype, "daysCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], EmployeeLeave.prototype, "reason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: LeaveStatus, default: LeaveStatus.PENDING }),
    __metadata("design:type", String)
], EmployeeLeave.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], EmployeeLeave.prototype, "appliedDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], EmployeeLeave.prototype, "approvedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], EmployeeLeave.prototype, "approvalNote", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], EmployeeLeave.prototype, "isDeleted", void 0);
exports.EmployeeLeave = EmployeeLeave = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, versionKey: false })
], EmployeeLeave);
exports.EmployeeLeaveSchema = mongoose_1.SchemaFactory.createForClass(EmployeeLeave);
//# sourceMappingURL=employee-leave.schema.js.map