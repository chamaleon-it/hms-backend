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
exports.UpdateUserDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class AvailabilityDto {
    startDate;
    endDate;
    startTime;
    endTime;
    days;
    rounds;
}
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AvailabilityDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AvailabilityDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AvailabilityDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AvailabilityDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsArray)({ message: 'days must be an array' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], AvailabilityDto.prototype, "days", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RoundsDto),
    __metadata("design:type", Array)
], AvailabilityDto.prototype, "rounds", void 0);
class RoundsDto {
    label;
    start;
    end;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoundsDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoundsDto.prototype, "start", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RoundsDto.prototype, "end", void 0);
class UpdateUserDto {
    name;
    phoneNumber;
    email;
    hospital;
    specialization;
    profilePic;
    qualification;
    licenseNo;
    designation;
    signature;
    availability;
    status;
    consultationFee;
    department;
    address;
    isDeleted;
}
exports.UpdateUserDto = UpdateUserDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Name must be a string' }),
    (0, class_validator_1.MinLength)(2, { message: 'Name must be at least 2 characters' }),
    (0, class_validator_1.MaxLength)(50, { message: 'Name must be at most 50 characters' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Phone number must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'Enter a valid email address' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Hospital must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateUserDto.prototype, "hospital", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Specialization must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateUserDto.prototype, "specialization", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Profile picture must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateUserDto.prototype, "profilePic", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Qualification must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateUserDto.prototype, "qualification", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'License No must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateUserDto.prototype, "licenseNo", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Designation must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateUserDto.prototype, "designation", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Signature must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateUserDto.prototype, "signature", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AvailabilityDto),
    __metadata("design:type", AvailabilityDto)
], UpdateUserDto.prototype, "availability", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Status must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Consultation fee must be a number' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateUserDto.prototype, "consultationFee", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Department must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateUserDto.prototype, "department", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Address must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpdateUserDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateUserDto.prototype, "isDeleted", void 0);
//# sourceMappingURL=updateUser.dto.js.map