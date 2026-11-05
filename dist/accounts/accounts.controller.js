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
exports.AccountsController = void 0;
const common_1 = require("@nestjs/common");
const accounts_service_1 = require("./accounts.service");
const create_account_transaction_dto_1 = require("./dto/create-account-transaction.dto");
const update_account_transaction_dto_1 = require("./dto/update-account-transaction.dto");
const get_account_transactions_dto_1 = require("./dto/get-account-transactions.dto");
const get_account_analytics_dto_1 = require("./dto/get-account-analytics.dto");
const auth_guard_1 = require("../auth/auth.guard");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
let AccountsController = class AccountsController {
    accountsService;
    constructor(accountsService) {
        this.accountsService = accountsService;
    }
    async create(dto, user) {
        const data = await this.accountsService.create(dto, user.id);
        return {
            message: 'Account transaction created successfully',
            data,
        };
    }
    async findAll(query) {
        const res = await this.accountsService.findAll(query);
        return {
            message: 'Account transactions retrieved successfully',
            ...res,
        };
    }
    async getAnalytics(query) {
        const data = await this.accountsService.getAnalytics(query);
        return {
            message: 'Account analytics retrieved successfully',
            data,
        };
    }
    async findOne(id) {
        const data = await this.accountsService.findOne(id);
        return {
            message: 'Account transaction retrieved successfully',
            data,
        };
    }
    async update(id, dto, user) {
        const data = await this.accountsService.update(id, dto, user.id);
        return {
            message: 'Account transaction updated successfully',
            data,
        };
    }
    async remove(id, user) {
        const data = await this.accountsService.remove(id, user.id);
        return {
            message: 'Account transaction deleted successfully',
            data,
        };
    }
};
exports.AccountsController = AccountsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_account_transaction_dto_1.CreateAccountTransactionDto, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_account_transactions_dto_1.GetAccountTransactionsDto]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_account_analytics_dto_1.GetAccountAnalyticsDto]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_account_transaction_dto_1.UpdateAccountTransactionDto, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AccountsController.prototype, "remove", null);
exports.AccountsController = AccountsController = __decorate([
    (0, common_1.Controller)('accounts'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [accounts_service_1.AccountsService])
], AccountsController);
//# sourceMappingURL=accounts.controller.js.map