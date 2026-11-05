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
exports.PurchaseEntrySchema = exports.PurchaseEntry = exports.PaymentStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "Pending";
    PaymentStatus["PAID"] = "Paid";
    PaymentStatus["PARTIALLY_PAID"] = "Partially Paid";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
let PurchaseEntry = class PurchaseEntry {
    supplier;
    invoiceNumber;
    invoiceDate;
    gstEnabled;
    tscEnabled;
    items;
    subTotal;
    discount;
    gst;
    transportCharge;
    total;
    paidAmount;
    description;
    paymentStatus;
};
exports.PurchaseEntry = PurchaseEntry;
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        ref: 'Supplier',
        type: mongoose_2.default.Schema.Types.ObjectId,
    }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], PurchaseEntry.prototype, "supplier", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], PurchaseEntry.prototype, "invoiceNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Date)
], PurchaseEntry.prototype, "invoiceDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], PurchaseEntry.prototype, "gstEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], PurchaseEntry.prototype, "tscEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)([
        {
            item: {
                type: mongoose_2.default.Schema.Types.ObjectId,
                ref: 'Item',
                required: true,
            },
            batch: { type: String, required: true },
            quantity: { type: Number, required: true },
            pack: { type: Number, required: true },
            noOfPack: { type: Number, required: false },
            unitPrice: { type: Number, required: true },
            expiryDate: { type: Date, required: true },
            purchasePrice: { type: Number, required: true },
            gst: { type: Number, required: true },
            discount: { type: Number, required: true },
            free: { type: Number, required: true },
        },
    ]),
    __metadata("design:type", Array)
], PurchaseEntry.prototype, "items", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PurchaseEntry.prototype, "subTotal", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PurchaseEntry.prototype, "discount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PurchaseEntry.prototype, "gst", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PurchaseEntry.prototype, "transportCharge", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PurchaseEntry.prototype, "total", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], PurchaseEntry.prototype, "paidAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", String)
], PurchaseEntry.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: PaymentStatus.PENDING, enum: PaymentStatus }),
    __metadata("design:type", String)
], PurchaseEntry.prototype, "paymentStatus", void 0);
exports.PurchaseEntry = PurchaseEntry = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, versionKey: false })
], PurchaseEntry);
exports.PurchaseEntrySchema = mongoose_1.SchemaFactory.createForClass(PurchaseEntry);
//# sourceMappingURL=purchase-entry.schema.js.map