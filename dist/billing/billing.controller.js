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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const billing_service_1 = require("./billing.service");
const create_billing_dto_1 = require("./dto/create-billing.dto");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const auth_guard_1 = require("../auth/auth.guard");
const mongoose_1 = __importDefault(require("mongoose"));
const get_bills_dto_1 = require("./dto/get-bills.dto");
const add_billing_item_dto_1 = require("./dto/add-billing-item.dto");
const get_billing_item_dto_1 = require("./dto/get-billing-item.dto");
const add_payment_dto_1 = require("./dto/add-payment.dto");
const mark_as_paind_dto_1 = require("./dto/mark-as-paind.dto");
const update_billing_item_dto_1 = require("./dto/update-billing-item.dto");
const get_bill_dropdown_dto_1 = require("./dto/get-bill-dropdown.dto");
const update_billing_dto_1 = require("./dto/update-billing.dto");
let BillingController = class BillingController {
    billingService;
    constructor(billingService) {
        this.billingService = billingService;
    }
    async generateBill(createBill, user) {
        createBill.user = user.id;
        const data = await this.billingService.generateBill(createBill);
        return {
            message: 'Bill is created successfully.',
            data,
        };
    }
    async getBills(user, getBillisDto) {
        const { data, total } = await this.billingService.getBills(user.id, getBillisDto);
        return {
            message: 'All bills were retrieved successfully.',
            data,
            total,
            page: Number(getBillisDto.page),
            limit: Number(getBillisDto.limit),
        };
    }
    async getBillDropDown(getBillDropDownDto) {
        const data = await this.billingService.getBillDropDown(getBillDropDownDto);
        return {
            data,
            message: 'Bill drop down retrieved successfully',
        };
    }
    async getSingleCustomerBill(q, role) {
        const data = await this.billingService.getSingleCustomerBill(q, role);
        return {
            data,
            message: 'Single bill were retrieved successfully',
        };
    }
    async addBillingItem(addBillingItemDto, user) {
        const data = await this.billingService.addBillingItem(addBillingItemDto, user.id);
        return {
            data,
            message: 'New item added to billing.',
        };
    }
    async getBillingItems(getBillingItemDto, user) {
        const data = await this.billingService.getBillingItems(getBillingItemDto, user.id);
        return {
            data,
            message: 'billing item retrieved successfully',
        };
    }
    async updateBillingItem(id, updateBillingItemDto, user) {
        const data = await this.billingService.updateBillingItem(id, updateBillingItemDto, user.id);
        return {
            data,
            message: 'Item is updated successfully.',
        };
    }
    async deleteBillingItem(item, user) {
        const data = await this.billingService.deleteBillingItem(item, user.id);
        return {
            message: 'Item is deleted',
            data,
        };
    }
    async getBillByReportId(reportId) {
        const data = await this.billingService.getBillByReportId(reportId);
        return {
            data,
            message: 'Bill retrieved successfully by report ID.',
        };
    }
    async getBill(id) {
        const data = await this.billingService.getBill(id);
        return {
            data,
            message: 'Bill were retrieved successfully.',
        };
    }
    async updateBill(id, updateBillDto) {
        const data = await this.billingService.updateBill(id, updateBillDto);
        return {
            data,
            message: 'Bill updated successfully.',
        };
    }
    async addPayment(id, addPaymentDto, user) {
        const data = await this.billingService.addPayment(id, addPaymentDto, user.id);
        return {
            data,
            message: 'Payment is added successfully.',
        };
    }
    async markAsPaid(id, markAsPaidDto) {
        const data = await this.billingService.markAsPaid(id, markAsPaidDto);
        return {
            data,
            message: 'Bill is marked as paid successfully.',
        };
    }
    convertDoctorString(body) {
        if (!body || !body.doctorString) {
            return {
                success: false,
                message: 'Request body must contain "doctorString" field',
            };
        }
        const result = this.billingService.validateAndConvertDoctorString(body.doctorString);
        return {
            success: result.valid,
            ...result,
        };
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_billing_dto_1.CreateBillingDto, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "generateBill", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, get_bills_dto_1.GetBillisDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getBills", null);
__decorate([
    (0, common_1.Get)('drop-down'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_bill_dropdown_dto_1.GetBillDropdownDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getBillDropDown", null);
__decorate([
    (0, common_1.Get)('single'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getSingleCustomerBill", null);
__decorate([
    (0, common_1.Post)('billing_item'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [add_billing_item_dto_1.AddBillingItemDto, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "addBillingItem", null);
__decorate([
    (0, common_1.Get)('billing_items'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_billing_item_dto_1.GetBillingItemDto, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getBillingItems", null);
__decorate([
    (0, common_1.Patch)('billing_item/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId, update_billing_item_dto_1.UpdateBillingItemDto, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "updateBillingItem", null);
__decorate([
    (0, common_1.Delete)('billing_item'),
    __param(0, (0, common_1.Query)('item')),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "deleteBillingItem", null);
__decorate([
    (0, common_1.Get)('report/:reportId'),
    __param(0, (0, common_1.Param)('reportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getBillByReportId", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getBill", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId, update_billing_dto_1.UpdateBillingDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "updateBill", null);
__decorate([
    (0, common_1.Patch)('add_payment/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId, add_payment_dto_1.AddPaymentDto, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "addPayment", null);
__decorate([
    (0, common_1.Patch)('mark_as_paid/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId, mark_as_paind_dto_1.MarkAsPaidDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "markAsPaid", null);
__decorate([
    (0, common_1.Post)('convert-doctor-string'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "convertDoctorString", null);
exports.BillingController = BillingController = __decorate([
    (0, common_1.Controller)('billing'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map