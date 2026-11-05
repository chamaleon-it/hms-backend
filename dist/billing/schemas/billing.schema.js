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
exports.BillingSchema = exports.Billing = exports.BillingItemSchema = exports.BillingItem = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let BillingItem = class BillingItem {
    name;
    quantity;
    unitPrice;
    gst;
    discount;
    total;
    batchNumber;
    expiryDate;
    generic;
};
exports.BillingItem = BillingItem;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], BillingItem.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 1 }),
    __metadata("design:type", Number)
], BillingItem.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], BillingItem.prototype, "unitPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], BillingItem.prototype, "gst", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], BillingItem.prototype, "discount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Number, default: 0 }),
    __metadata("design:type", Number)
], BillingItem.prototype, "total", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true }),
    __metadata("design:type", String)
], BillingItem.prototype, "batchNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], BillingItem.prototype, "expiryDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, trim: true }),
    __metadata("design:type", String)
], BillingItem.prototype, "generic", void 0);
exports.BillingItem = BillingItem = __decorate([
    (0, mongoose_1.Schema)({ _id: false, versionKey: false })
], BillingItem);
exports.BillingItemSchema = mongoose_1.SchemaFactory.createForClass(BillingItem);
let Billing = class Billing {
    billingCategory;
    user;
    patient;
    doctor;
    therapistName;
    inCharge;
    items;
    cash;
    card;
    upi;
    discount;
    note;
    mrn;
    roundOff;
    transactionType;
    salesMRN;
    status;
    reportId;
    token;
    tokenNumber;
};
exports.Billing = Billing;
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['Pharmacy', 'Procedure', 'Reception', 'Other'] }),
    __metadata("design:type", String)
], Billing.prototype, "billingCategory", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Billing.prototype, "user", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Patient', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Billing.prototype, "patient", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        nullable: true,
    }),
    __metadata("design:type", Object)
], Billing.prototype, "doctor", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '' }),
    __metadata("design:type", String)
], Billing.prototype, "therapistName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: '' }),
    __metadata("design:type", String)
], Billing.prototype, "inCharge", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.BillingItemSchema], default: [] }),
    __metadata("design:type", Array)
], Billing.prototype, "items", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Billing.prototype, "cash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Billing.prototype, "card", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Billing.prototype, "upi", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Billing.prototype, "discount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", String)
], Billing.prototype, "note", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: true, unique: true }),
    __metadata("design:type", String)
], Billing.prototype, "mrn", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, required: true, default: false }),
    __metadata("design:type", Boolean)
], Billing.prototype, "roundOff", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: ['Sale', 'Return', 'Refund'],
        default: 'Sale',
    }),
    __metadata("design:type", String)
], Billing.prototype, "transactionType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", String)
], Billing.prototype, "salesMRN", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['Draft', 'Completed'], default: 'Draft' }),
    __metadata("design:type", String)
], Billing.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'Report', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Billing.prototype, "reportId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, required: false }),
    __metadata("design:type", String)
], Billing.prototype, "token", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, required: false }),
    __metadata("design:type", Number)
], Billing.prototype, "tokenNumber", void 0);
exports.Billing = Billing = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, versionKey: false })
], Billing);
exports.BillingSchema = mongoose_1.SchemaFactory.createForClass(Billing);
//# sourceMappingURL=billing.schema.js.map