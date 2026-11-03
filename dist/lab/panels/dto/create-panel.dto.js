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
exports.CreatePanelDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const mongoose_1 = __importDefault(require("mongoose"));
class CreatePanelDto {
    name;
    price;
    estimatedTime;
    method;
    specimen;
    tests;
    mainHeading;
    subheadings;
    testSubheadings;
    department;
    user;
}
exports.CreatePanelDto = CreatePanelDto;
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value.trim()),
    (0, class_validator_1.IsString)({ message: 'Panel name must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Panel name should not be empty' }),
    __metadata("design:type", String)
], CreatePanelDto.prototype, "name", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value),
    (0, class_validator_1.IsNumber)({}, { message: 'Panel price must be a number' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Panel price should not be empty' }),
    (0, class_validator_1.Min)(1, { message: 'Panel price should be greater than 0' }),
    __metadata("design:type", Number)
], CreatePanelDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Estimated time must be a number' }),
    __metadata("design:type", Number)
], CreatePanelDto.prototype, "estimatedTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Method must be a string' }),
    __metadata("design:type", String)
], CreatePanelDto.prototype, "method", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Specimen must be a string' }),
    __metadata("design:type", String)
], CreatePanelDto.prototype, "specimen", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePanelDto.prototype, "tests", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreatePanelDto.prototype, "mainHeading", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePanelDto.prototype, "subheadings", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePanelDto.prototype, "testSubheadings", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePanelDto.prototype, "department", void 0);
__decorate([
    (0, class_validator_1.IsEmpty)(),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], CreatePanelDto.prototype, "user", void 0);
//# sourceMappingURL=create-panel.dto.js.map