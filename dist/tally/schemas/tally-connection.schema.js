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
exports.TallyConnectionSchema = exports.TallyConnection = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let TallyConnection = class TallyConnection {
    key;
    host;
    port;
    companyName;
    cashLedger;
    upiLedger;
    cardLedger;
    salesLedger;
    expenseLedger;
    pharmacyPaymentLedger;
    therapyReceiptLedger;
    therapyPaymentLedger;
    receptionReceiptLedger;
    receptionPaymentLedger;
    purchasePaymentLedger;
    connected;
    lastCheckedAt;
    lastError;
    connectedAt;
    connectedBy;
};
exports.TallyConnection = TallyConnection;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, default: 'pharmacy' }),
    __metadata("design:type", String)
], TallyConnection.prototype, "key", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'localhost' }),
    __metadata("design:type", String)
], TallyConnection.prototype, "host", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 9000 }),
    __metadata("design:type", Number)
], TallyConnection.prototype, "port", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: '' }),
    __metadata("design:type", String)
], TallyConnection.prototype, "companyName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'Cash' }),
    __metadata("design:type", String)
], TallyConnection.prototype, "cashLedger", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'UPI' }),
    __metadata("design:type", String)
], TallyConnection.prototype, "upiLedger", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'Card' }),
    __metadata("design:type", String)
], TallyConnection.prototype, "cardLedger", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'Pharmacy Sales' }),
    __metadata("design:type", String)
], TallyConnection.prototype, "salesLedger", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'Indirect Expenses' }),
    __metadata("design:type", String)
], TallyConnection.prototype, "expenseLedger", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'Pharmacy Returns' }),
    __metadata("design:type", String)
], TallyConnection.prototype, "pharmacyPaymentLedger", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'Therapy Income' }),
    __metadata("design:type", String)
], TallyConnection.prototype, "therapyReceiptLedger", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'Therapy Refunds' }),
    __metadata("design:type", String)
], TallyConnection.prototype, "therapyPaymentLedger", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'Reception Income' }),
    __metadata("design:type", String)
], TallyConnection.prototype, "receptionReceiptLedger", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'Reception Refunds' }),
    __metadata("design:type", String)
], TallyConnection.prototype, "receptionPaymentLedger", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: 'Purchase Payments' }),
    __metadata("design:type", String)
], TallyConnection.prototype, "purchasePaymentLedger", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: false }),
    __metadata("design:type", Boolean)
], TallyConnection.prototype, "connected", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], TallyConnection.prototype, "lastCheckedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], TallyConnection.prototype, "lastError", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", Date)
], TallyConnection.prototype, "connectedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], TallyConnection.prototype, "connectedBy", void 0);
exports.TallyConnection = TallyConnection = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, versionKey: false, collection: 'tally_connections' })
], TallyConnection);
exports.TallyConnectionSchema = mongoose_1.SchemaFactory.createForClass(TallyConnection);
//# sourceMappingURL=tally-connection.schema.js.map