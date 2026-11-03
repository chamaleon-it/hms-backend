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
exports.UpdatePasswordDto = void 0;
const class_validator_1 = require("class-validator");
class UpdatePasswordDto {
    currentPassword;
    password;
    confirmPassword;
}
exports.UpdatePasswordDto = UpdatePasswordDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Current password is required' }),
    __metadata("design:type", String)
], UpdatePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Password is required' }),
    (0, class_validator_1.MinLength)(8, { message: 'Password must be at least 8 characters' }),
    (0, class_validator_1.MaxLength)(72, { message: 'Password must be at most 72 characters' }),
    (0, class_validator_1.Matches)(/[a-z]/, { message: 'Must contain at least one lowercase letter' }),
    (0, class_validator_1.Matches)(/[A-Z]/, { message: 'Must contain at least one uppercase letter' }),
    (0, class_validator_1.Matches)(/\d/, { message: 'Must contain at least one number' }),
    (0, class_validator_1.Matches)(/[^\w\s]/, { message: 'Must contain at least one symbol' }),
    __metadata("design:type", String)
], UpdatePasswordDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Confirm password is required' }),
    __metadata("design:type", String)
], UpdatePasswordDto.prototype, "confirmPassword", void 0);
//# sourceMappingURL=updatePassword.js.map