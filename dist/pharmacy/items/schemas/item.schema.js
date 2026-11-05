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
exports.ItemSchema = exports.Item = exports.BatchSchema = exports.Batch = exports.ItemStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
var ItemStatus;
(function (ItemStatus) {
    ItemStatus["Active"] = "Active";
    ItemStatus["Inactive"] = "Inactive";
    ItemStatus["Deleted"] = "Deleted";
})(ItemStatus || (exports.ItemStatus = ItemStatus = {}));
let Batch = class Batch {
    batchNumber;
    packing;
    stripCount;
    mrp;
    unitPrice;
    purchasePrice;
    gst;
    quantity;
    startingQuantity;
    isActive;
    supplier;
    expiryDate;
    createdAt;
};
exports.Batch = Batch;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Batch.prototype, "batchNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Batch.prototype, "packing", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Batch.prototype, "stripCount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Batch.prototype, "mrp", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Batch.prototype, "unitPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Batch.prototype, "purchasePrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Batch.prototype, "gst", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Batch.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Batch.prototype, "startingQuantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], Batch.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '-' }),
    __metadata("design:type", String)
], Batch.prototype, "supplier", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], Batch.prototype, "expiryDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], Batch.prototype, "createdAt", void 0);
exports.Batch = Batch = __decorate([
    (0, mongoose_1.Schema)({ _id: true, timestamps: true, versionKey: false })
], Batch);
exports.BatchSchema = mongoose_1.SchemaFactory.createForClass(Batch);
let Item = class Item {
    name;
    pharmacy;
    generic;
    hsnCode;
    sku;
    category;
    manufacturer;
    soldQuantity;
    soldHistory;
    rackLocation;
    status;
    batches;
};
exports.Item = Item;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Item.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], Item.prototype, "pharmacy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Item.prototype, "generic", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        trim: true,
        default: '-',
    }),
    __metadata("design:type", String)
], Item.prototype, "hsnCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: false,
        trim: true,
        uppercase: true,
        unique: true,
        sparse: true,
    }),
    __metadata("design:type", String)
], Item.prototype, "sku", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, default: 'Medicine' }),
    __metadata("design:type", String)
], Item.prototype, "category", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true, default: '-' }),
    __metadata("design:type", String)
], Item.prototype, "manufacturer", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: Number,
        default: 0,
        required: true,
    }),
    __metadata("design:type", Number)
], Item.prototype, "soldQuantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [
            {
                date: { type: Date, required: true },
                quantity: { type: Number, required: true },
                unitPrice: { type: Number, required: true },
                total: { type: Number, required: true },
                customerName: { type: String },
                customerPhone: { type: String },
                doctorName: { type: String },
                pharmacistName: { type: String },
                patientMrn: { type: String },
            },
        ],
        default: [],
        required: true,
    }),
    __metadata("design:type", Array)
], Item.prototype, "soldHistory", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '-' }),
    __metadata("design:type", String)
], Item.prototype, "rackLocation", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: ItemStatus,
        default: ItemStatus.Active,
    }),
    __metadata("design:type", String)
], Item.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [exports.BatchSchema],
        default: [],
    }),
    __metadata("design:type", Array)
], Item.prototype, "batches", void 0);
exports.Item = Item = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, versionKey: false })
], Item);
exports.ItemSchema = mongoose_1.SchemaFactory.createForClass(Item);
//# sourceMappingURL=item.schema.js.map