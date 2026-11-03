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
exports.CreateTestDto = exports.RangeItemDto = exports.DateTypeEnum = exports.GenderEnum = exports.DataTypeEnum = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const mongoose_1 = __importDefault(require("mongoose"));
var DataTypeEnum;
(function (DataTypeEnum) {
    DataTypeEnum["NUMBER"] = "number";
    DataTypeEnum["TEXT"] = "text";
    DataTypeEnum["BOOLEAN"] = "boolean";
    DataTypeEnum["OPTIONS"] = "options";
})(DataTypeEnum || (exports.DataTypeEnum = DataTypeEnum = {}));
var GenderEnum;
(function (GenderEnum) {
    GenderEnum["BOTH"] = "Both";
    GenderEnum["MALE"] = "Male";
    GenderEnum["FEMALE"] = "Female";
})(GenderEnum || (exports.GenderEnum = GenderEnum = {}));
var DateTypeEnum;
(function (DateTypeEnum) {
    DateTypeEnum["YEAR"] = "Year";
    DateTypeEnum["MONTH"] = "Month";
    DateTypeEnum["DAY"] = "Day";
})(DateTypeEnum || (exports.DateTypeEnum = DateTypeEnum = {}));
class RangeItemDto {
    name;
    min;
    max;
    upto;
    fromAge;
    toAge;
    gender;
    dateType;
}
exports.RangeItemDto = RangeItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RangeItemDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RangeItemDto.prototype, "min", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RangeItemDto.prototype, "max", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RangeItemDto.prototype, "upto", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RangeItemDto.prototype, "fromAge", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RangeItemDto.prototype, "toAge", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(GenderEnum),
    __metadata("design:type", String)
], RangeItemDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(DateTypeEnum),
    __metadata("design:type", String)
], RangeItemDto.prototype, "dateType", void 0);
class CreateTestDto {
    code;
    name;
    price;
    method;
    specimen;
    type;
    estimatedTime;
    dataType;
    unit;
    panels;
    user;
    options;
    range;
    note;
    department;
}
exports.CreateTestDto = CreateTestDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Code must be a string' }),
    __metadata("design:type", String)
], CreateTestDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Name must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Name is required' }),
    __metadata("design:type", String)
], CreateTestDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Price must be a number' }),
    __metadata("design:type", Number)
], CreateTestDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestDto.prototype, "method", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestDto.prototype, "specimen", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Type must be a string' }),
    __metadata("design:type", String)
], CreateTestDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Estimated time must be a number' }),
    __metadata("design:type", Number)
], CreateTestDto.prototype, "estimatedTime", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(DataTypeEnum, { message: 'Invalid dataType' }),
    __metadata("design:type", String)
], CreateTestDto.prototype, "dataType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Unit must be a string' }),
    __metadata("design:type", String)
], CreateTestDto.prototype, "unit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Panels must be an array' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Each panel must be a string' }),
    __metadata("design:type", Array)
], CreateTestDto.prototype, "panels", void 0);
__decorate([
    (0, class_validator_1.IsEmpty)({ message: 'User should not be provided' }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], CreateTestDto.prototype, "user", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.dataType === DataTypeEnum.OPTIONS),
    (0, class_validator_1.IsArray)({ message: 'Options must be an array' }),
    (0, class_validator_1.ArrayNotEmpty)({ message: 'Options cannot be empty' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Each option must be a string' }),
    __metadata("design:type", Array)
], CreateTestDto.prototype, "options", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Range must be an array' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RangeItemDto),
    __metadata("design:type", Array)
], CreateTestDto.prototype, "range", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Note must be a string' }),
    __metadata("design:type", String)
], CreateTestDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTestDto.prototype, "department", void 0);
//# sourceMappingURL=create-test.dto.js.map