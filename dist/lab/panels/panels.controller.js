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
exports.PanelsController = void 0;
const common_1 = require("@nestjs/common");
const panels_service_1 = require("./panels.service");
const create_panel_dto_1 = require("./dto/create-panel.dto");
const auth_guard_1 = require("../../auth/auth.guard");
const get_user_decorator_1 = require("../../auth/decorators/get-user.decorator");
const create_test_dto_1 = require("./dto/create-test.dto");
const mongoose_1 = __importDefault(require("mongoose"));
const add_test_dto_1 = require("./dto/add-test.dto");
const create_group_dto_1 = require("./dto/create-group.dto");
let PanelsController = class PanelsController {
    panelsService;
    constructor(panelsService) {
        this.panelsService = panelsService;
    }
    async createPanel(createPanelDto, user) {
        createPanelDto.user = user.id;
        const data = await this.panelsService.createPanel(createPanelDto);
        return {
            message: 'Panel created successfully',
            data,
        };
    }
    async getPanels() {
        const data = await this.panelsService.getPanels();
        return {
            message: 'Panels fetched successfully',
            data,
        };
    }
    async deletePanel(id) {
        await this.panelsService.deletePanel(id);
        return {
            message: 'Panel deleted successfully',
        };
    }
    async updatePanel(id, updatePanelDto) {
        const data = await this.panelsService.updatePanel(id, updatePanelDto);
        return {
            message: 'Panel updated successfully',
            data,
        };
    }
    async createTest(dto, user) {
        dto.user = user.id;
        const data = await this.panelsService.createTest(dto);
        return {
            message: 'Test created successfully',
            data,
        };
    }
    async getTests() {
        const data = await this.panelsService.getTests();
        return {
            message: 'Tests fetched successfully',
            data,
        };
    }
    async updateTest(id, dto, user) {
        dto.user = user.id;
        const data = await this.panelsService.updateTest(id, dto);
        return {
            message: 'Test updated successfully',
            data,
        };
    }
    async addTestToPanel(addTestDto) {
        const data = await this.panelsService.addTestToPanel(addTestDto);
        return {
            message: 'Test added to panel successfully',
            data,
        };
    }
    async removeTestFromPanel(addTestDto) {
        const data = await this.panelsService.removeTestFromPanel(addTestDto);
        return {
            message: 'Test removed from panel successfully',
            data,
        };
    }
    async deleteTest(id) {
        const data = await this.panelsService.deleteTest(id);
        return {
            message: 'Test is deleted',
            data,
        };
    }
    async createGroup(dto, user) {
        dto.user = user.id;
        const data = await this.panelsService.createGroup(dto);
        return { message: 'Group created successfully', data };
    }
    async getGroups() {
        const data = await this.panelsService.getGroups();
        return { message: 'Groups fetched successfully', data };
    }
    async updateGroup(name, dto) {
        const data = await this.panelsService.updateGroup(name, dto);
        return { message: 'Group updated successfully', data };
    }
    async deleteGroup(name) {
        await this.panelsService.deleteGroup(name);
        return { message: 'Group deleted successfully' };
    }
};
exports.PanelsController = PanelsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_panel_dto_1.CreatePanelDto, Object]),
    __metadata("design:returntype", Promise)
], PanelsController.prototype, "createPanel", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PanelsController.prototype, "getPanels", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PanelsController.prototype, "deletePanel", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_panel_dto_1.CreatePanelDto]),
    __metadata("design:returntype", Promise)
], PanelsController.prototype, "updatePanel", null);
__decorate([
    (0, common_1.Post)('create_test'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_test_dto_1.CreateTestDto, Object]),
    __metadata("design:returntype", Promise)
], PanelsController.prototype, "createTest", null);
__decorate([
    (0, common_1.Get)('tests'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PanelsController.prototype, "getTests", null);
__decorate([
    (0, common_1.Patch)('test/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId, create_test_dto_1.CreateTestDto, Object]),
    __metadata("design:returntype", Promise)
], PanelsController.prototype, "updateTest", null);
__decorate([
    (0, common_1.Post)('add_test'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [add_test_dto_1.AddTestDto]),
    __metadata("design:returntype", Promise)
], PanelsController.prototype, "addTestToPanel", null);
__decorate([
    (0, common_1.Post)('remove_test'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [add_test_dto_1.AddTestDto]),
    __metadata("design:returntype", Promise)
], PanelsController.prototype, "removeTestFromPanel", null);
__decorate([
    (0, common_1.Delete)('test/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], PanelsController.prototype, "deleteTest", null);
__decorate([
    (0, common_1.Post)('groups'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_group_dto_1.CreateGroupDto, Object]),
    __metadata("design:returntype", Promise)
], PanelsController.prototype, "createGroup", null);
__decorate([
    (0, common_1.Get)('groups'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PanelsController.prototype, "getGroups", null);
__decorate([
    (0, common_1.Patch)('groups/:name'),
    __param(0, (0, common_1.Param)('name')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_group_dto_1.CreateGroupDto]),
    __metadata("design:returntype", Promise)
], PanelsController.prototype, "updateGroup", null);
__decorate([
    (0, common_1.Delete)('groups/:name'),
    __param(0, (0, common_1.Param)('name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PanelsController.prototype, "deleteGroup", null);
exports.PanelsController = PanelsController = __decorate([
    (0, common_1.Controller)('lab/panels'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [panels_service_1.PanelsService])
], PanelsController);
//# sourceMappingURL=panels.controller.js.map