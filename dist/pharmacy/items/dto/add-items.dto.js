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
exports.AddItemDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const item_schema_1 = require("../schemas/item.schema");
const trim = ({ value }) => typeof value === 'string' ? value.trim() : value;
class AddItemDto {
    name;
    generic;
    hsnCode;
    sku;
    category;
    supplier;
    manufacturer;
    unitPrice;
    mrp;
    purchasePrice;
    openingStockQuantity;
    quantity;
    expiryDate;
    batchNumber;
    rackLocation;
    packing;
    noOfpacking;
    noOfPacking;
    stripCount;
    gst;
    status = item_schema_1.ItemStatus.Active;
}
exports.AddItemDto = AddItemDto;
__decorate([
    (0, class_validator_1.IsString)({ message: 'Name must be a string.' }),
    (0, class_validator_1.MinLength)(2, { message: 'Name must be at least 2 characters.' }),
    (0, class_validator_1.MaxLength)(120, { message: 'Name must be at most 120 characters.' }),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsNotEmpty)({ message: 'Name is required.' }),
    __metadata("design:type", String)
], AddItemDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Generic must be a string.' }),
    (0, class_validator_1.MaxLength)(120, { message: 'Generic must be at most 120 characters.' }),
    (0, class_transformer_1.Transform)(trim),
    __metadata("design:type", String)
], AddItemDto.prototype, "generic", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(trim),
    __metadata("design:type", String)
], AddItemDto.prototype, "hsnCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'SKU must be a string.' }),
    (0, class_validator_1.MaxLength)(64, { message: 'SKU must be at most 64 characters.' }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value),
    __metadata("design:type", String)
], AddItemDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Category must be a string.' }),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsNotEmpty)({ message: 'Category is required.' }),
    __metadata("design:type", String)
], AddItemDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'Supplier must be a string.' }),
    (0, class_transformer_1.Transform)(trim),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AddItemDto.prototype, "supplier", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Manufacturer must be a string.' }),
    (0, class_transformer_1.Transform)(trim),
    __metadata("design:type", String)
], AddItemDto.prototype, "manufacturer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 }, { message: 'Unit price must be a number (max 2 decimals).' }),
    (0, class_validator_1.Min)(0, { message: 'Unit price cannot be negative.' }),
    __metadata("design:type", Number)
], AddItemDto.prototype, "unitPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 }, { message: 'MRP must be a number (max 2 decimals).' }),
    (0, class_validator_1.Min)(0, { message: 'MRP cannot be negative.' }),
    __metadata("design:type", Number)
], AddItemDto.prototype, "mrp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 }, { message: 'Unit price must be a number (max 2 decimals).' }),
    (0, class_validator_1.Min)(0, { message: 'Purchase price cannot be negative.' }),
    __metadata("design:type", Number)
], AddItemDto.prototype, "purchasePrice", void 0);
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ message: 'Opening stock must be an integer.' }),
    (0, class_validator_1.Min)(0, { message: 'Opening stock cannot be negative.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AddItemDto.prototype, "openingStockQuantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ message: 'Quantity must be an integer.' }),
    (0, class_validator_1.Min)(0, { message: 'Quantity cannot be negative.' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], AddItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Expiry date must be an ISO date (YYYY-MM-DD or full ISO).' }),
    __metadata("design:type", String)
], AddItemDto.prototype, "expiryDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Batch number must be a string.' }),
    (0, class_transformer_1.Transform)(trim),
    __metadata("design:type", String)
], AddItemDto.prototype, "batchNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Rack location must be a string.' }),
    (0, class_transformer_1.Transform)(trim),
    __metadata("design:type", String)
], AddItemDto.prototype, "rackLocation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AddItemDto.prototype, "packing", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AddItemDto.prototype, "noOfpacking", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AddItemDto.prototype, "noOfPacking", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AddItemDto.prototype, "stripCount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AddItemDto.prototype, "gst", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(item_schema_1.ItemStatus, {
        message: `Status must be one of: ${Object.values(item_schema_1.ItemStatus).join(', ')}.`,
    }),
    (0, class_transformer_1.Transform)(({ value }) => (value ? String(value).trim() : item_schema_1.ItemStatus.Active)),
    __metadata("design:type", String)
], AddItemDto.prototype, "status", void 0);
//# sourceMappingURL=add-items.dto.js.map