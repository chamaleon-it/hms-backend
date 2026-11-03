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
exports.CreateReturnDto = exports.CreateReturnItemDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const mongoose_1 = __importDefault(require("mongoose"));
const return_schema_1 = require("../schemas/return.schema");
class CreateReturnItemDto {
    name;
    quantity;
    reason;
    unitPrice;
}
exports.CreateReturnItemDto = CreateReturnItemDto;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], CreateReturnItemDto.prototype, "name", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateReturnItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(return_schema_1.ReturnReason),
    __metadata("design:type", String)
], CreateReturnItemDto.prototype, "reason", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateReturnItemDto.prototype, "unitPrice", void 0);
class CreateReturnDto {
    patient;
    order;
    items;
    refundMode;
    returnedBy;
    remarks;
    billNo;
}
exports.CreateReturnDto = CreateReturnDto;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], CreateReturnDto.prototype, "patient", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], CreateReturnDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateReturnItemDto),
    __metadata("design:type", Array)
], CreateReturnDto.prototype, "items", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(return_schema_1.RefundMode),
    __metadata("design:type", String)
], CreateReturnDto.prototype, "refundMode", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(return_schema_1.ReturnedBy),
    __metadata("design:type", String)
], CreateReturnDto.prototype, "returnedBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReturnDto.prototype, "remarks", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReturnDto.prototype, "billNo", void 0);
//# sourceMappingURL=create-return.dto.js.map