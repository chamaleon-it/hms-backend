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
exports.UpdateInPatientDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_in_patient_dto_1 = require("./create-in-patient.dto");
const class_validator_1 = require("class-validator");
class UpdateInPatientDto extends (0, mapped_types_1.PartialType)(create_in_patient_dto_1.CreateInPatientDto) {
    dischargeDate;
}
exports.UpdateInPatientDto = UpdateInPatientDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UpdateInPatientDto.prototype, "dischargeDate", void 0);
//# sourceMappingURL=update-in-patient.dto.js.map