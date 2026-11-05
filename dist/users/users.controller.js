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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const createUser_dto_1 = require("./dto/createUser.dto");
const auth_guard_1 = require("../auth/auth.guard");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const updateUser_dto_1 = require("./dto/updateUser.dto");
const updatePassword_1 = require("./dto/updatePassword");
const mongoose_1 = __importDefault(require("mongoose"));
const public_decorator_1 = require("../auth/decorators/public.decorator");
const throttler_1 = require("@nestjs/throttler");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_schema_1 = require("./schemas/user.schema");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async createUser(createUserDto) {
        const data = await this.usersService.createUser(createUserDto);
        return {
            data,
            message: 'Your account has been created successfully. Please wait while we review your profile — this process may take up to 24 hours.',
        };
    }
    async getProfile(user) {
        const data = await this.usersService.getProfile(user);
        return {
            data,
            message: 'user profile retrieved',
        };
    }
    async forgotPassword(forgotPasswordDto) {
        await this.usersService.forgotPassword(forgotPasswordDto);
        return {
            message: 'If an account exists for that email, a password reset link will be sent.',
        };
    }
    async getAllDoctors(includeDeleted) {
        const data = await this.usersService.getAllDoctors(includeDeleted === 'true');
        return {
            data,
            message: 'All doctors data retrieved successfully',
        };
    }
    async getUsersByRole(role) {
        const data = await this.usersService.getUsersByRole(role);
        return {
            data,
            message: `All ${role} data retrieved successfully`,
        };
    }
    async getAllPharmacyWholesaler() {
        const data = await this.usersService.getAllPharmacyWholesaler();
        return {
            data,
            message: 'All pharmacy wholesaler data retrieved successfully',
        };
    }
    async getDoctorAvailability(id) {
        const data = await this.usersService.getDoctorAvailability(id);
        return {
            message: 'Doctor availability retrieved successfully',
            data,
        };
    }
    async syncConsultationValues(user, body) {
        const data = await this.usersService.syncConsultationValues(user.id, body.value);
        return {
            message: 'Consultation values sync completed',
            data,
        };
    }
    async getConsultationValues(user) {
        const data = await this.usersService.getConsultationValues(user.id);
        return {
            message: 'Consultation value retrieved successfully',
            data,
        };
    }
    async updatePassword(user, updatePasswordDto) {
        await this.usersService.updatePassword(user.id, updatePasswordDto);
        return {
            message: 'User password is updated.',
        };
    }
    async updateUser(user, updateUserDto) {
        const data = await this.usersService.updateUser(user.id, updateUserDto);
        return {
            message: data
                ? 'User profile updated successfully.'
                : 'Failed to update user profile. Please try again later.',
            data,
        };
    }
    async deleteUser(actor, id) {
        if (actor.role === user_schema_1.UserRole.RECEPTION || actor.role === user_schema_1.UserRole.ACCOUNTANT) {
            const role = await this.usersService.findUserRoleById(id);
            if (role !== user_schema_1.UserRole.DOCTOR) {
                throw new common_1.ForbiddenException('Only doctor accounts can be soft-deleted from this role.');
            }
        }
        const data = await this.usersService.softDeleteUser(id);
        return {
            message: 'Doctor soft deleted successfully.',
            data,
        };
    }
    async updateUserById(actor, id, updateUserDto) {
        if (actor.role === user_schema_1.UserRole.RECEPTION || actor.role === user_schema_1.UserRole.ACCOUNTANT) {
            const role = await this.usersService.findUserRoleById(id);
            if (role !== user_schema_1.UserRole.DOCTOR) {
                throw new common_1.ForbiddenException('Only doctor accounts can be updated from this role.');
            }
            if (updateUserDto.role &&
                updateUserDto.role !== user_schema_1.UserRole.DOCTOR) {
                throw new common_1.ForbiddenException('This role cannot change user roles.');
            }
        }
        const data = await this.usersService.updateUser(id, updateUserDto);
        return {
            message: data
                ? 'User profile updated successfully.'
                : 'Failed to update user profile. Please try again later.',
            data,
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [createUser_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, common_1.Post)('forgot_password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('doctors'),
    __param(0, (0, common_1.Query)('includeDeleted')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAllDoctors", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('role/:role'),
    __param(0, (0, common_1.Param)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUsersByRole", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('pharmacy_wholesaler'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAllPharmacyWholesaler", null);
__decorate([
    (0, common_1.Get)('doctor_availability/:id'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getDoctorAvailability", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('consultation_values'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "syncConsultationValues", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('consultation_values'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getConsultationValues", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('update_password'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, updatePassword_1.UpdatePasswordDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updatePassword", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, updateUser_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUser", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.RECEPTION, user_schema_1.UserRole.ACCOUNTANT),
    (0, common_1.Delete)(':id'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.RECEPTION, user_schema_1.UserRole.ACCOUNTANT),
    (0, common_1.Patch)(':id'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mongoose_1.default.Types.ObjectId, updateUser_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUserById", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map