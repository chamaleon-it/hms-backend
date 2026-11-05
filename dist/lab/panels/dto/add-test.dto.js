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
exports.AddTestDto = void 0;
const class_validator_1 = require("class-validator");
class AddTestDto {
    panelName;
    tests;
}
exports.AddTestDto = AddTestDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Panel name is required' }),
    (0, class_validator_1.IsString)({ message: 'Panel name must be a string' }),
    __metadata("design:type", String)
], AddTestDto.prototype, "panelName", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Tests array is required' }),
    (0, class_validator_1.IsArray)({ message: 'Tests must be an array' }),
    (0, class_validator_1.IsMongoId)({ each: true, message: 'Each test must be a valid MongoDB ID' }),
    __metadata("design:type", Array)
], AddTestDto.prototype, "tests", void 0);
//# sourceMappingURL=add-test.dto.js.map