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
exports.PharmacyController = void 0;
const common_1 = require("@nestjs/common");
const pharmacy_service_1 = require("./pharmacy.service");
const auth_guard_1 = require("../../auth/auth.guard");
const get_user_decorator_1 = require("../../auth/decorators/get-user.decorator");
const update_general_dto_1 = require("./dto/update-general.dto");
const update_billing_dto_1 = require("./dto/update-billing.dto");
const update_inventory_dto_1 = require("./dto/update-inventory.dto");
const update_notifications_dto_1 = require("./dto/update-notifications.dto");
let PharmacyController = class PharmacyController {
    pharmacyService;
    constructor(pharmacyService) {
        this.pharmacyService = pharmacyService;
    }
    async updateGeneral(user, updateGeneralDto) {
        const data = await this.pharmacyService.updateGeneral(user.id, updateGeneralDto);
        return {
            data,
            message: 'Pharmacy general settings updated successfully',
        };
    }
    async updateBilling(user, dto) {
        const data = await this.pharmacyService.updateBilling(user.id, dto);
        return {
            data,
            message: 'Pharmacy billing settings updated successfully',
        };
    }
    async updateInventory(user, dto) {
        const data = await this.pharmacyService.updateInventory(user.id, dto);
        return {
            data,
            message: 'Pharmacy inventory settings updated successfully',
        };
    }
    async updateNotifications(user, dto) {
        const data = await this.pharmacyService.updateNotifications(user.id, dto);
        return {
            data,
            message: 'Pharmacy notifications settings updated successfully',
        };
    }
};
exports.PharmacyController = PharmacyController;
__decorate([
    (0, common_1.Patch)('general'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_general_dto_1.UpdateGeneralDto]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "updateGeneral", null);
__decorate([
    (0, common_1.Patch)('billing'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_billing_dto_1.UpdateBillingDto]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "updateBilling", null);
__decorate([
    (0, common_1.Patch)('inventory'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_inventory_dto_1.UpdateInventoryDto]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "updateInventory", null);
__decorate([
    (0, common_1.Patch)('notifications'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_notifications_dto_1.UpdateNotificationsDto]),
    __metadata("design:returntype", Promise)
], PharmacyController.prototype, "updateNotifications", null);
exports.PharmacyController = PharmacyController = __decorate([
    (0, common_1.Controller)('users/pharmacy'),
    __metadata("design:paramtypes", [pharmacy_service_1.PharmacyService])
], PharmacyController);
//# sourceMappingURL=pharmacy.controller.js.map