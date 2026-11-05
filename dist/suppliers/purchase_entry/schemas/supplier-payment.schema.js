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
exports.SupplierPaymentSchema = exports.SupplierPayment = exports.SupplierPaymentAllocationSchema = exports.SupplierPaymentAllocation = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
let SupplierPaymentAllocation = class SupplierPaymentAllocation {
    purchaseEntry;
    invoiceNumber;
    amount;
};
exports.SupplierPaymentAllocation = SupplierPaymentAllocation;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: 'PurchaseEntry',
        required: true,
    }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], SupplierPaymentAllocation.prototype, "purchaseEntry", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SupplierPaymentAllocation.prototype, "invoiceNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], SupplierPaymentAllocation.prototype, "amount", void 0);
exports.SupplierPaymentAllocation = SupplierPaymentAllocation = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], SupplierPaymentAllocation);
exports.SupplierPaymentAllocationSchema = mongoose_1.SchemaFactory.createForClass(SupplierPaymentAllocation);
let SupplierPayment = class SupplierPayment {
    supplier;
    cash;
    card;
    upi;
    total;
    date;
    allocations;
};
exports.SupplierPayment = SupplierPayment;
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        ref: 'Supplier',
        type: mongoose_2.default.Schema.Types.ObjectId,
    }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], SupplierPayment.prototype, "supplier", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0, min: 0 }),
    __metadata("design:type", Number)
], SupplierPayment.prototype, "cash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0, min: 0 }),
    __metadata("design:type", Number)
], SupplierPayment.prototype, "card", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 0, min: 0 }),
    __metadata("design:type", Number)
], SupplierPayment.prototype, "upi", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], SupplierPayment.prototype, "total", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Date }),
    __metadata("design:type", Date)
], SupplierPayment.prototype, "date", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.SupplierPaymentAllocationSchema], default: [] }),
    __metadata("design:type", Array)
], SupplierPayment.prototype, "allocations", void 0);
exports.SupplierPayment = SupplierPayment = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, versionKey: false, collection: 'supplierpayments' })
], SupplierPayment);
exports.SupplierPaymentSchema = mongoose_1.SchemaFactory.createForClass(SupplierPayment);
//# sourceMappingURL=supplier-payment.schema.js.map