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
exports.LabController = void 0;
const common_1 = require("@nestjs/common");
const lab_service_1 = require("./lab.service");
const auth_guard_1 = require("../../auth/auth.guard");
const get_user_decorator_1 = require("../../auth/decorators/get-user.decorator");
const update_general_dto_1 = require("./dto/update-general.dto");
const update_billing_dto_1 = require("./dto/update-billing.dto");
const update_notifications_dto_1 = require("./dto/update-notifications.dto");
const update_catalogue_dto_1 = require("./dto/update-catalogue.dto");
const update_report_layout_dto_1 = require("./dto/update-report-layout.dto");
let LabController = class LabController {
    labService;
    constructor(labService) {
        this.labService = labService;
    }
    async updateGeneral(user, updateGeneralDto) {
        const data = await this.labService.updateGeneral(user.id, updateGeneralDto);
        return {
            data,
            message: 'Lab general settings updated successfully',
        };
    }
    async updateBilling(user, dto) {
        const data = await this.labService.updateBilling(user.id, dto);
        return {
            data,
            message: 'Lab billing settings updated successfully',
        };
    }
    async updateCatalogue(user, dto) {
        const data = await this.labService.updateCatalogue(user.id, dto);
        return {
            data,
            message: 'Lab catalogue settings updated successfully',
        };
    }
    async getLab() {
        const data = await this.labService.getLab();
        return {
            data,
            message: 'All labs were retrieved successfully.',
        };
    }
    async updateNotifications(user, dto) {
        const data = await this.labService.updateNotifications(user.id, dto);
        return {
            data,
            message: 'Lab notifications settings updated successfully',
        };
    }
    async updateReportLayout(user, dto) {
        const data = await this.labService.updateReportLayout(user.id, dto);
        return {
            data,
            message: 'Lab report layout updated successfully',
        };
    }
};
exports.LabController = LabController;
__decorate([
    (0, common_1.Patch)('general'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_general_dto_1.UpdateGeneralDto]),
    __metadata("design:returntype", Promise)
], LabController.prototype, "updateGeneral", null);
__decorate([
    (0, common_1.Patch)('billing'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_billing_dto_1.UpdateBillingDto]),
    __metadata("design:returntype", Promise)
], LabController.prototype, "updateBilling", null);
__decorate([
    (0, common_1.Patch)('catalogue'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_catalogue_dto_1.UpdateCatalogueDto]),
    __metadata("design:returntype", Promise)
], LabController.prototype, "updateCatalogue", null);
__decorate([
    (0, common_1.Get)(''),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LabController.prototype, "getLab", null);
__decorate([
    (0, common_1.Patch)('notifications'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_notifications_dto_1.UpdateNotificationsDto]),
    __metadata("design:returntype", Promise)
], LabController.prototype, "updateNotifications", null);
__decorate([
    (0, common_1.Patch)('update_report_layout'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_report_layout_dto_1.UpdateReportLayoutDto]),
    __metadata("design:returntype", Promise)
], LabController.prototype, "updateReportLayout", null);
exports.LabController = LabController = __decorate([
    (0, common_1.Controller)('users/lab'),
    __metadata("design:paramtypes", [lab_service_1.LabService])
], LabController);
//# sourceMappingURL=lab.controller.js.map