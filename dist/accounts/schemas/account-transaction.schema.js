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
exports.AccountTransactionSchema = exports.AccountTransaction = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importDefault(require("mongoose"));
const account_transaction_enum_1 = require("../enums/account-transaction.enum");
const ledger_group_1 = require("../ledger-group");
let AccountTransaction = class AccountTransaction {
    transactionId;
    type;
    category;
    amount;
    description;
    paymentMethod;
    sourceModule;
    notes;
    ledgerGroup;
    costCentre;
    transactionDate;
    createdBy;
    updatedBy;
    isDeleted;
    deletedAt;
    tallySynced;
    tallySyncedAt;
    tallyVoucherType;
    tallyError;
};
exports.AccountTransaction = AccountTransaction;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], AccountTransaction.prototype, "transactionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: account_transaction_enum_1.TransactionType, type: String }),
    __metadata("design:type", String)
], AccountTransaction.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AccountTransaction.prototype, "category", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0 }),
    __metadata("design:type", Number)
], AccountTransaction.prototype, "amount", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], AccountTransaction.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: false,
        enum: account_transaction_enum_1.PaymentMethod,
        type: String,
        default: account_transaction_enum_1.PaymentMethod.Cash,
    }),
    __metadata("design:type", String)
], AccountTransaction.prototype, "paymentMethod", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        required: false,
        enum: account_transaction_enum_1.SourceModule,
        type: String,
        default: account_transaction_enum_1.SourceModule.Uncategorised,
    }),
    __metadata("design:type", String)
], AccountTransaction.prototype, "sourceModule", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], AccountTransaction.prototype, "notes", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, enum: ledger_group_1.TallyLedgerGroup, type: String }),
    __metadata("design:type", String)
], AccountTransaction.prototype, "ledgerGroup", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], AccountTransaction.prototype, "costCentre", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, type: Date }),
    __metadata("design:type", Date)
], AccountTransaction.prototype, "transactionDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], AccountTransaction.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.default.Schema.Types.ObjectId, ref: 'User', required: false }),
    __metadata("design:type", mongoose_2.default.Types.ObjectId)
], AccountTransaction.prototype, "updatedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], AccountTransaction.prototype, "isDeleted", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: false }),
    __metadata("design:type", Date)
], AccountTransaction.prototype, "deletedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], AccountTransaction.prototype, "tallySynced", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, required: false }),
    __metadata("design:type", Date)
], AccountTransaction.prototype, "tallySyncedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], AccountTransaction.prototype, "tallyVoucherType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], AccountTransaction.prototype, "tallyError", void 0);
exports.AccountTransaction = AccountTransaction = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, versionKey: false })
], AccountTransaction);
exports.AccountTransactionSchema = mongoose_1.SchemaFactory.createForClass(AccountTransaction);
//# sourceMappingURL=account-transaction.schema.js.map