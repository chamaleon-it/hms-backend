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
exports.CreateLeaveDto = void 0;
const class_validator_1 = require("class-validator");
const employee_leave_schema_1 = require("../schemas/employee-leave.schema");
class CreateLeaveDto {
    employee;
    leaveType;
    startDate;
    endDate;
    daysCount;
    reason;
    status;
    approvalNote;
}
exports.CreateLeaveDto = CreateLeaveDto;
__decorate([
    (0, class_validator_1.IsMongoId)({ message: 'Employee ID must be a valid MongoDB ObjectId' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Employee ID is required' }),
    __metadata("design:type", String)
], CreateLeaveDto.prototype, "employee", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(employee_leave_schema_1.LeaveType, { message: 'Invalid leave type' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Leave type is required' }),
    __metadata("design:type", String)
], CreateLeaveDto.prototype, "leaveType", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Start date is required' }),
    __metadata("design:type", Object)
], CreateLeaveDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'End date is required' }),
    __metadata("design:type", Object)
], CreateLeaveDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Days count must be a number' }),
    (0, class_validator_1.Min)(0.5, { message: 'Days count must be at least 0.5' }),
    __metadata("design:type", Number)
], CreateLeaveDto.prototype, "daysCount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLeaveDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(employee_leave_schema_1.LeaveStatus),
    __metadata("design:type", String)
], CreateLeaveDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLeaveDto.prototype, "approvalNote", void 0);
//# sourceMappingURL=create-leave.dto.js.map