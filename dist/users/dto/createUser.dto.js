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
exports.CreateUserDto = exports.MatchPasswordConstraint = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
let MatchPasswordConstraint = class MatchPasswordConstraint {
    validate(confirmPassword, args) {
        const object = args.object;
        return object.password === confirmPassword;
    }
    defaultMessage() {
        return 'Passwords do not match.';
    }
};
exports.MatchPasswordConstraint = MatchPasswordConstraint;
exports.MatchPasswordConstraint = MatchPasswordConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'MatchPassword', async: false })
], MatchPasswordConstraint);
class CreateUserDto {
    name;
    username;
    role;
    email;
    qualification;
    licenseNo;
    designation;
    password;
    confirmPassword;
    consultationFee;
    phoneNumber;
    specialization;
    department;
    address;
    hospital;
    status;
    profilePic;
    signature;
    availability;
    isDeleted;
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Name must be a string.' }),
    (0, class_transformer_1.Transform)(({ value }) => value.trim()),
    __metadata("design:type", String)
], CreateUserDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Username must be a string.' }),
    (0, class_transformer_1.Transform)(({ value }) => value.trim().toLowerCase()),
    __metadata("design:type", String)
], CreateUserDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Role must be a string.' }),
    (0, class_transformer_1.Transform)(({ value }) => value.trim()),
    __metadata("design:type", String)
], CreateUserDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'Email must be a valid email address.' }),
    (0, class_transformer_1.Transform)(({ value }) => value.trim().toLowerCase()),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Qualification must be a string.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "qualification", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'License No must be a string.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "licenseNo", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Designation must be a string.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "designation", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Password must be a string.' }),
    (0, class_validator_1.MinLength)(6, { message: 'Password must be at least 6 characters long.' }),
    (0, class_transformer_1.Transform)(({ value }) => value.trim()),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Confirm password must be a string.' }),
    (0, class_validator_1.Validate)(MatchPasswordConstraint, { message: 'Passwords do not match.' }),
    (0, class_transformer_1.Transform)(({ value }) => value.trim()),
    __metadata("design:type", String)
], CreateUserDto.prototype, "confirmPassword", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Consultation fee must be a number.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateUserDto.prototype, "consultationFee", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Phone number must be a string.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Specialization must be a string.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "specialization", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Department must be a string.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "department", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Address must be a string.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Hospital must be a string.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "hospital", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Status must be a string.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Profile pic must be a string.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "profilePic", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Signature must be a string.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "signature", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateUserDto.prototype, "availability", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateUserDto.prototype, "isDeleted", void 0);
//# sourceMappingURL=createUser.dto.js.map