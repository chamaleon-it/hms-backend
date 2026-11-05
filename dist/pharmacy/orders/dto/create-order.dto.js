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
exports.CreateOrderDto = exports.OrderItemDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const order_schema_1 = require("../schemas/order.schema");
const mongoose_1 = __importDefault(require("mongoose"));
class OrderItemDto {
    name;
    isCustom;
    referralName;
    dosage;
    frequency;
    food;
    duration;
    quantity;
    batchNumber;
    unitPrice;
    mrp;
    gst;
    purchasePrice;
    availableQuantity;
    medicineName;
    rowId;
    packing;
    stripCount;
    expiryDate;
    supplier;
}
exports.OrderItemDto = OrderItemDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)({ message: 'Item name must be a valid MongoDB ObjectId' }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], OrderItemDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OrderItemDto.prototype, "isCustom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrderItemDto.prototype, "referralName", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Dosage must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OrderItemDto.prototype, "dosage", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Frequency must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OrderItemDto.prototype, "frequency", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Food instruction must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OrderItemDto.prototype, "food", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Duration must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OrderItemDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Duration cannot be empty.' }),
    __metadata("design:type", Number)
], OrderItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Batch number must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OrderItemDto.prototype, "batchNumber", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], OrderItemDto.prototype, "unitPrice", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], OrderItemDto.prototype, "mrp", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], OrderItemDto.prototype, "gst", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], OrderItemDto.prototype, "purchasePrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], OrderItemDto.prototype, "availableQuantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrderItemDto.prototype, "medicineName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrderItemDto.prototype, "rowId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], OrderItemDto.prototype, "packing", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], OrderItemDto.prototype, "stripCount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], OrderItemDto.prototype, "expiryDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OrderItemDto.prototype, "supplier", void 0);
class CreateOrderDto {
    mrn;
    patient;
    doctor;
    items;
    priority = order_schema_1.OrderPriority.Normal;
    status = order_schema_1.OrderStatus.Pending;
    discount;
    assignedTo;
    allergies;
    pharmacist;
    doctorName;
    advice;
}
exports.CreateOrderDto = CreateOrderDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'MRN must be a string' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "mrn", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)({ message: 'Patient ID must be a valid MongoDB ObjectId' }),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], CreateOrderDto.prototype, "patient", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", mongoose_1.default.Types.ObjectId)
], CreateOrderDto.prototype, "doctor", void 0);
__decorate([
    (0, class_validator_1.IsArray)({ message: 'Items must be an array' }),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'At least one item is required' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => OrderItemDto),
    __metadata("design:type", Array)
], CreateOrderDto.prototype, "items", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(order_schema_1.OrderPriority, {
        message: `Priority must be one of: ${Object.values(order_schema_1.OrderPriority).join(', ')}`,
    }),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(order_schema_1.OrderStatus, {
        message: `Status must be one of: ${Object.values(order_schema_1.OrderStatus).join(', ')}`,
    }),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "discount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)({ message: 'AssignedTo must be a valid MongoDB ObjectId' }),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "assignedTo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "allergies", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "pharmacist", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "doctorName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "advice", void 0);
//# sourceMappingURL=create-order.dto.js.map