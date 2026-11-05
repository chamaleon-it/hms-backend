"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderSchema = exports.Order = exports.OrderItemSchema = exports.OrderItem = exports.PaymentStatus = exports.OrderStatus = exports.OrderPriority = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importStar(require("mongoose"));
var OrderPriority;
(function (OrderPriority) {
    OrderPriority["Normal"] = "Normal";
    OrderPriority["Stat"] = "Stat";
    OrderPriority["Routine"] = "Routine";
    OrderPriority["VIP"] = "VIP";
})(OrderPriority || (exports.OrderPriority = OrderPriority = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["Pending"] = "Pending";
    OrderStatus["Failed"] = "Failed";
    OrderStatus["Canceled"] = "Canceled";
    OrderStatus["Completed"] = "Completed";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["Pending"] = "Pending";
    PaymentStatus["Paid"] = "Paid";
    PaymentStatus["Partial"] = "Partial";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
let OrderItem = class OrderItem {
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
    expiryDate;
};
exports.OrderItem = OrderItem;
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: 'Item',
        required: false,
        default: null,
    }),
    __metadata("design:type", Object)
], OrderItem.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], OrderItem.prototype, "isCustom", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], OrderItem.prototype, "referralName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], OrderItem.prototype, "dosage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], OrderItem.prototype, "frequency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], OrderItem.prototype, "food", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], OrderItem.prototype, "duration", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], OrderItem.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null, trim: true }),
    __metadata("design:type", String)
], OrderItem.prototype, "batchNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], OrderItem.prototype, "unitPrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], OrderItem.prototype, "mrp", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], OrderItem.prototype, "gst", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], OrderItem.prototype, "purchasePrice", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date }),
    __metadata("design:type", Date)
], OrderItem.prototype, "expiryDate", void 0);
exports.OrderItem = OrderItem = __decorate([
    (0, mongoose_1.Schema)({ _id: false, versionKey: false })
], OrderItem);
exports.OrderItemSchema = mongoose_1.SchemaFactory.createForClass(OrderItem);
let Order = class Order {
    mrn;
    patient;
    doctor;
    doctorName;
    items;
    advice;
    priority;
    status;
    discount;
    assignedTo;
    pharmacist;
    paymentStatus;
    paidAmount;
    cash;
    card;
    upi;
    paymentReference;
    billNo;
    isDeleted;
};
exports.Order = Order;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], Order.prototype, "mrn", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Order.prototype, "patient", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: mongoose_2.default.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null,
    }),
    __metadata("design:type", Object)
], Order.prototype, "doctor", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '-' }),
    __metadata("design:type", String)
], Order.prototype, "doctorName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.OrderItemSchema], default: [] }),
    __metadata("design:type", Array)
], Order.prototype, "items", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Order.prototype, "advice", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(OrderPriority),
        default: OrderPriority.Normal,
    }),
    __metadata("design:type", String)
], Order.prototype, "priority", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(OrderStatus),
        default: OrderStatus.Pending,
    }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        default: 0,
        type: Number,
    }),
    __metadata("design:type", Number)
], Order.prototype, "discount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: null }),
    __metadata("design:type", String)
], Order.prototype, "assignedTo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '-' }),
    __metadata("design:type", String)
], Order.prototype, "pharmacist", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: true,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.Pending,
    }),
    __metadata("design:type", String)
], Order.prototype, "paymentStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0, required: true }),
    __metadata("design:type", Number)
], Order.prototype, "paidAmount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "cash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "card", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "upi", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '-' }),
    __metadata("design:type", String)
], Order.prototype, "paymentReference", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '-' }),
    __metadata("design:type", String)
], Order.prototype, "billNo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Order.prototype, "isDeleted", void 0);
exports.Order = Order = __decorate([
    (0, mongoose_1.Schema)({ versionKey: false, timestamps: true })
], Order);
exports.OrderSchema = mongoose_1.SchemaFactory.createForClass(Order);
//# sourceMappingURL=order.schema.js.map