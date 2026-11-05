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
exports.CreateAccountTransactionDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const account_transaction_enum_1 = require("../enums/account-transaction.enum");
class CreateAccountTransactionDto {
    type;
    category;
    amount;
    description;
    paymentMethod;
    sourceModule;
    notes;
    transactionDate;
}
exports.CreateAccountTransactionDto = CreateAccountTransactionDto;
__decorate([
    (0, class_validator_1.IsEnum)(account_transaction_enum_1.TransactionType, {
        message: 'Type must be either Income or Expense',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAccountTransactionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Category is required' }),
    __metadata("design:type", String)
], CreateAccountTransactionDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'Amount must be greater than zero' }),
    __metadata("design:type", Number)
], CreateAccountTransactionDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Description is required' }),
    __metadata("design:type", String)
], CreateAccountTransactionDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(account_transaction_enum_1.PaymentMethod, {
        message: 'Payment method must be Cash, Card, or UPI',
    }),
    __metadata("design:type", String)
], CreateAccountTransactionDto.prototype, "paymentMethod", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(account_transaction_enum_1.SourceModule, {
        message: 'Source module must be Uncategorised, Doctor, Pharmacy, Lab, or Reception',
    }),
    __metadata("design:type", String)
], CreateAccountTransactionDto.prototype, "sourceModule", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAccountTransactionDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsDate)({ message: 'Valid transaction date is required' }),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], CreateAccountTransactionDto.prototype, "transactionDate", void 0);
//# sourceMappingURL=create-account-transaction.dto.js.map