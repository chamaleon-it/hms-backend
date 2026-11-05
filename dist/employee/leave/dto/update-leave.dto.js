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
exports.UpdateLeaveStatusDto = exports.UpdateLeaveDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_leave_dto_1 = require("./create-leave.dto");
const class_validator_1 = require("class-validator");
const employee_leave_schema_1 = require("../schemas/employee-leave.schema");
class UpdateLeaveDto extends (0, mapped_types_1.PartialType)(create_leave_dto_1.CreateLeaveDto) {
    status;
    approvedBy;
    approvalNote;
}
exports.UpdateLeaveDto = UpdateLeaveDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(employee_leave_schema_1.LeaveStatus),
    __metadata("design:type", String)
], UpdateLeaveDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateLeaveDto.prototype, "approvedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateLeaveDto.prototype, "approvalNote", void 0);
class UpdateLeaveStatusDto {
    status;
    approvalNote;
    approvedBy;
}
exports.UpdateLeaveStatusDto = UpdateLeaveStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(employee_leave_schema_1.LeaveStatus, { message: 'Status must be Pending, Approved, Rejected, or Cancelled' }),
    __metadata("design:type", String)
], UpdateLeaveStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateLeaveStatusDto.prototype, "approvalNote", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateLeaveStatusDto.prototype, "approvedBy", void 0);
//# sourceMappingURL=update-leave.dto.js.map