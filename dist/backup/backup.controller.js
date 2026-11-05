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
exports.BackupController = void 0;
const common_1 = require("@nestjs/common");
const backup_service_1 = require("./backup.service");
const auth_guard_1 = require("../auth/auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_schema_1 = require("../users/schemas/user.schema");
let BackupController = class BackupController {
    backupService;
    constructor(backupService) {
        this.backupService = backupService;
    }
    async createBackup() {
        return this.backupService.backupDatabase();
    }
    async listBackups() {
        const data = await this.backupService.listBackups();
        return {
            data,
            message: 'Backups list',
            latestBackup: data[0],
        };
    }
    async restoreBackup(id) {
        return this.backupService.restoreDatabase(id);
    }
    async restoreLatestBackup() {
        return this.backupService.restoreLatestBackup();
    }
};
exports.BackupController = BackupController;
__decorate([
    (0, common_1.Post)('create'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BackupController.prototype, "createBackup", null);
__decorate([
    (0, common_1.Get)('list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BackupController.prototype, "listBackups", null);
__decorate([
    (0, common_1.Post)('restore/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BackupController.prototype, "restoreBackup", null);
__decorate([
    (0, common_1.Post)('restore_latest'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BackupController.prototype, "restoreLatestBackup", null);
exports.BackupController = BackupController = __decorate([
    (0, common_1.Controller)('backup'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [backup_service_1.BackupService])
], BackupController);
//# sourceMappingURL=backup.controller.js.map