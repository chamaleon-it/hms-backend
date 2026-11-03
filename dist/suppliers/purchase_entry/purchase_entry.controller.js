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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseEntryController = void 0;
const common_1 = require("@nestjs/common");
const purchase_entry_service_1 = require("./purchase_entry.service");
const create_purchase_entry_dto_1 = require("./dto/create-purchase-entry.dto");
const add_payment_dto_1 = require("./dto/add-payment.dto");
const record_supplier_payment_dto_1 = require("./dto/record-supplier-payment.dto");
const list_supplier_payments_dto_1 = require("./dto/list-supplier-payments.dto");
const auth_guard_1 = require("../../auth/auth.guard");
let PurchaseEntryController = class PurchaseEntryController {
    purchaseEntryService;
    constructor(purchaseEntryService) {
        this.purchaseEntryService = purchaseEntryService;
    }
    async create(createPurchaseEntryDto) {
        return {
            data: await this.purchaseEntryService.create(createPurchaseEntryDto),
            message: 'Purchase Entry Created Successfully',
        };
    }
    async findAll(query) {
        const result = await this.purchaseEntryService.findAll(query);
        return {
            ...result,
            message: 'Purchase Entries Retrieved Successfully',
        };
    }
    async findBySupplier(id) {
        return {
            data: await this.purchaseEntryService.findBySupplier(id),
            message: 'Purchase Entry Found Successfully',
        };
    }
    async listOpenInvoices(id) {
        return {
            data: await this.purchaseEntryService.listOpenInvoices(id),
            message: 'Open purchase invoices retrieved successfully',
        };
    }
    async listSupplierPayments(id, query) {
        return {
            data: await this.purchaseEntryService.listSupplierPayments(id, query),
            message: 'Supplier payments retrieved successfully',
        };
    }
    async recordSupplierPayment(id, dto) {
        return {
            data: await this.purchaseEntryService.recordSupplierPayment(id, dto),
            message: 'Payment recorded successfully',
        };
    }
    async findOne(id) {
        return {
            data: await this.purchaseEntryService.findById(id),
            message: 'Purchase Entry Found Successfully',
        };
    }
    async addPayment(id, addPaymentDto) {
        return {
            data: await this.purchaseEntryService.addPayment(id, addPaymentDto),
            message: 'Payment Added Successfully',
        };
    }
};
exports.PurchaseEntryController = PurchaseEntryController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_purchase_entry_dto_1.CreatePurchaseEntryDto]),
    __metadata("design:returntype", Promise)
], PurchaseEntryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PurchaseEntryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('/supplier/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PurchaseEntryController.prototype, "findBySupplier", null);
__decorate([
    (0, common_1.Get)('/supplier/:id/dues'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PurchaseEntryController.prototype, "listOpenInvoices", null);
__decorate([
    (0, common_1.Get)('/supplier/:id/payments'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, list_supplier_payments_dto_1.ListSupplierPaymentsDto]),
    __metadata("design:returntype", Promise)
], PurchaseEntryController.prototype, "listSupplierPayments", null);
__decorate([
    (0, common_1.Post)('/supplier/:id/payment'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, record_supplier_payment_dto_1.RecordSupplierPaymentDto]),
    __metadata("design:returntype", Promise)
], PurchaseEntryController.prototype, "recordSupplierPayment", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PurchaseEntryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('add_payment/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_payment_dto_1.AddPaymentDto]),
    __metadata("design:returntype", Promise)
], PurchaseEntryController.prototype, "addPayment", null);
exports.PurchaseEntryController = PurchaseEntryController = __decorate([
    (0, common_1.Controller)('purchase_entry'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [purchase_entry_service_1.PurchaseEntryService])
], PurchaseEntryController);
//# sourceMappingURL=purchase_entry.controller.js.map