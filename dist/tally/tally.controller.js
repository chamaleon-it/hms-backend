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
exports.TallyController = void 0;
const common_1 = require("@nestjs/common");
const tally_service_1 = require("./tally.service");
const connect_tally_dto_1 = require("./dto/connect-tally.dto");
const auth_guard_1 = require("../auth/auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const user_schema_1 = require("../users/schemas/user.schema");
let TallyController = class TallyController {
    tallyService;
    constructor(tallyService) {
        this.tallyService = tallyService;
    }
    async status() {
        const data = await this.tallyService.getStatus();
        return {
            data,
            message: data.connected
                ? 'Tally is connected'
                : 'Tally is not connected',
        };
    }
    async connect(dto, user) {
        const data = await this.tallyService.connect(dto, user?.id);
        return {
            data,
            message: `Connected to Tally on ${data.host}:${data.port}`,
        };
    }
    async disconnect() {
        const data = await this.tallyService.disconnect();
        return {
            data,
            message: 'Disconnected from Tally',
        };
    }
    async test() {
        const data = await this.tallyService.testConnection();
        return {
            data,
            message: data.message,
        };
    }
    async sync() {
        const data = await this.tallyService.syncPending();
        return {
            data,
            message: data.message,
        };
    }
};
exports.TallyController = TallyController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TallyController.prototype, "status", null);
__decorate([
    (0, common_1.Post)('connect'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [connect_tally_dto_1.ConnectTallyDto, Object]),
    __metadata("design:returntype", Promise)
], TallyController.prototype, "connect", null);
__decorate([
    (0, common_1.Post)('disconnect'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TallyController.prototype, "disconnect", null);
__decorate([
    (0, common_1.Post)('test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TallyController.prototype, "test", null);
__decorate([
    (0, common_1.Post)('sync'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TallyController.prototype, "sync", null);
exports.TallyController = TallyController = __decorate([
    (0, common_1.Controller)('tally'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ACCOUNTANT, user_schema_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [tally_service_1.TallyService])
], TallyController);
//# sourceMappingURL=tally.controller.js.map