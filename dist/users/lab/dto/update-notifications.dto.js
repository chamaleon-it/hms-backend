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
exports.UpdateNotificationsDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateNotificationsDto {
    whatsapp;
    sms;
    inApp;
    note;
}
exports.UpdateNotificationsDto = UpdateNotificationsDto;
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'whatsapp must be a boolean value' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'whatsapp is required' }),
    __metadata("design:type", Boolean)
], UpdateNotificationsDto.prototype, "whatsapp", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'sms must be a boolean value' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'sms is required' }),
    __metadata("design:type", Boolean)
], UpdateNotificationsDto.prototype, "sms", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'soundNotificationInApp must be a boolean value' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'soundNotificationInApp is required' }),
    __metadata("design:type", Boolean)
], UpdateNotificationsDto.prototype, "inApp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'note must be a string' }),
    __metadata("design:type", String)
], UpdateNotificationsDto.prototype, "note", void 0);
//# sourceMappingURL=update-notifications.dto.js.map