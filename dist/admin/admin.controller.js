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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const auth_guard_1 = require("../auth/auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_schema_1 = require("../users/schemas/user.schema");
const billing_service_1 = require("../billing/billing.service");
const get_bills_dto_1 = require("../billing/dto/get-bills.dto");
const common_2 = require("@nestjs/common");
let AdminController = class AdminController {
    adminService;
    billingService;
    constructor(adminService, billingService) {
        this.adminService = adminService;
        this.billingService = billingService;
    }
    async getAllBills(getBillisDto) {
        const { data, total } = await this.billingService.getBills(null, getBillisDto);
        return {
            message: 'All bills retrieved successfully.',
            data,
            total,
            page: Number(getBillisDto.page),
            limit: Number(getBillisDto.limit),
        };
    }
    async getDashboardStats() {
        const data = await this.adminService.getDashboardStats();
        return { message: 'Dashboard stats retrieved', data };
    }
    async getDashboardAnalytics(range) {
        const data = await this.adminService.getDashboardAnalytics(range);
        return { message: 'Dashboard analytics retrieved', data };
    }
    async getAllUsers() {
        const data = await this.adminService.getAllUsers();
        return { message: 'All users retrieved', data };
    }
    async getAllDoctors() {
        const data = await this.adminService.getUsersByRole(user_schema_1.UserRole.DOCTOR);
        return { message: 'Doctors retrieved', data };
    }
    async getClinicalAnalytics(range, startDate, endDate) {
        const data = await this.adminService.getClinicalAnalytics({
            range,
            startDate,
            endDate,
        });
        return { message: 'Clinical analytics retrieved successfully', data };
    }
    async getPatients(page, limit, search, gender, doctor, status) {
        const { data, total } = await this.adminService.getPatientsList({
            page,
            limit,
            search,
            gender,
            doctor,
            status,
        });
        return {
            message: 'Patients list retrieved successfully',
            data,
            total,
            page: Number(page) || 1,
            limit: Number(limit) || 10,
        };
    }
    async getAllStaff() {
        const data = await this.adminService.getAllStaff();
        return { message: 'Staff retrieved', data };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('billing'),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.ACCOUNTANT),
    __param(0, (0, common_2.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_bills_dto_1.GetBillisDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllBills", null);
__decorate([
    (0, common_1.Get)('dashboard/stats'),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.ACCOUNTANT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('dashboard/analytics'),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.ACCOUNTANT),
    __param(0, (0, common_2.Query)('range')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboardAnalytics", null);
__decorate([
    (0, common_1.Get)('users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)('doctors'),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.ACCOUNTANT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllDoctors", null);
__decorate([
    (0, common_1.Get)('clinical/analytics'),
    __param(0, (0, common_2.Query)('range')),
    __param(1, (0, common_2.Query)('startDate')),
    __param(2, (0, common_2.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getClinicalAnalytics", null);
__decorate([
    (0, common_1.Get)('patients'),
    __param(0, (0, common_2.Query)('page')),
    __param(1, (0, common_2.Query)('limit')),
    __param(2, (0, common_2.Query)('search')),
    __param(3, (0, common_2.Query)('gender')),
    __param(4, (0, common_2.Query)('doctor')),
    __param(5, (0, common_2.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPatients", null);
__decorate([
    (0, common_1.Get)('staff'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllStaff", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        billing_service_1.BillingService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map