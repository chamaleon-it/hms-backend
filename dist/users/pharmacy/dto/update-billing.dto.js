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
exports.UpdateBillingDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateBillingDto {
    prefix;
    defaultGst;
    roundOff;
    autoPrintAfterSave;
    autoGenerateBill;
    autoGeneratePrescription;
}
exports.UpdateBillingDto = UpdateBillingDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Prefix must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Prefix is required' }),
    __metadata("design:type", String)
], UpdateBillingDto.prototype, "prefix", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Default GST must be a number' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Default GST is required' }),
    __metadata("design:type", Number)
], UpdateBillingDto.prototype, "defaultGst", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'Round off must be a boolean' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Round off is required' }),
    __metadata("design:type", Boolean)
], UpdateBillingDto.prototype, "roundOff", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'Auto print after save must be a boolean' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Auto print after save is required' }),
    __metadata("design:type", Boolean)
], UpdateBillingDto.prototype, "autoPrintAfterSave", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'Auto generate bill must be a boolean' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Auto generate bill is required' }),
    __metadata("design:type", Boolean)
], UpdateBillingDto.prototype, "autoGenerateBill", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)({ message: 'Auto generate prescription must be a boolean' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Auto generate prescription is required' }),
    __metadata("design:type", Boolean)
], UpdateBillingDto.prototype, "autoGeneratePrescription", void 0);
//# sourceMappingURL=update-billing.dto.js.map