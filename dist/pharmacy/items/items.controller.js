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
exports.ItemsController = void 0;
const common_1 = require("@nestjs/common");
const items_service_1 = require("./items.service");
const auth_guard_1 = require("../../auth/auth.guard");
const get_user_decorator_1 = require("../../auth/decorators/get-user.decorator");
const add_items_dto_1 = require("./dto/add-items.dto");
const get_items_dto_1 = require("./dto/get-items.dto");
const add_batch_dto_1 = require("./dto/add-batch.dto");
const update_batch_dto_1 = require("./dto/update-batch.dto");
const mongoose_1 = __importDefault(require("mongoose"));
let ItemsController = class ItemsController {
    itemsService;
    constructor(itemsService) {
        this.itemsService = itemsService;
    }
    async addItems(user, addItemDto) {
        const data = await this.itemsService.addItems(user.id, addItemDto);
        return {
            data,
            message: 'Items added successfully',
        };
    }
    async getItems(user, query) {
        const data = await this.itemsService.getItems(query, user);
        return {
            data: data.items,
            total: data.total,
            page: Number(query.page),
            limit: Number(query.limit),
            lowStockCount: data.lowStockCount,
            slowMovingCount: data.slowMovingCount,
            message: 'All items were retrieved successfully',
        };
    }
    async getSuppliers(user) {
        const data = await this.itemsService.getSuppliers(user);
        return {
            data,
            message: 'All suppliers were retrieved successfully',
        };
    }
    async updateItem(user, addItemDto, id) {
        const data = await this.itemsService.updateItem(id, addItemDto, user);
        return {
            data,
            message: 'Item updated successfully.',
        };
    }
    async deleteItem(user, id) {
        const data = await this.itemsService.deleteItem(id, user);
        return {
            data,
            message: 'Item deleted successfully',
        };
    }
    async exportCsv(user, res) {
        const { csv, filename } = await this.itemsService.exportCsv(user);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.status(200).send(csv);
    }
    async getInventoryStatistics(user, lowStockThreshold) {
        const threshold = lowStockThreshold ? Number(lowStockThreshold) : 20;
        const data = await this.itemsService.getInventoryStatistics(user, threshold);
        return {
            data,
            message: 'Inventory statistics retrieved successfully',
        };
    }
    async getItem(user, id) {
        const data = await this.itemsService.getItem(id, user);
        return {
            data,
            message: 'Item retrieved successfully',
        };
    }
    async addBatchItems(user, id, batchData) {
        const data = await this.itemsService.addBatchItems(id, batchData, user);
        return {
            data,
            message: 'Batch items added successfully',
        };
    }
    async updateBatch(user, id, batchId, body) {
        const data = await this.itemsService.updateBatch(id, batchId, body, user);
        return {
            data,
            message: 'Batch updated successfully',
        };
    }
    async toggleBatchStatus(user, id, batchId) {
        const data = await this.itemsService.toggleBatchStatus(id, batchId, user);
        return {
            data,
            message: 'Batch status toggled successfully',
        };
    }
};
exports.ItemsController = ItemsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, add_items_dto_1.AddItemDto]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "addItems", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, get_items_dto_1.GetItemsDto]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "getItems", null);
__decorate([
    (0, common_1.Get)('suppliers'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "getSuppliers", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, add_items_dto_1.AddItemDto, mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "deleteItem", null);
__decorate([
    (0, common_1.Get)('export-csv'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "exportCsv", null);
__decorate([
    (0, common_1.Get)('statistics/dashboard'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Query)('lowStockThreshold')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "getInventoryStatistics", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "getItem", null);
__decorate([
    (0, common_1.Post)('add_batch/:id'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mongoose_1.default.Types.ObjectId, add_batch_dto_1.AddBatchDto]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "addBatchItems", null);
__decorate([
    (0, common_1.Patch)(':id/batch/:batchId'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('batchId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mongoose_1.default.Types.ObjectId, String, update_batch_dto_1.UpdateBatchDto]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "updateBatch", null);
__decorate([
    (0, common_1.Patch)(':id/batch/:batchId/toggle'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('batchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mongoose_1.default.Types.ObjectId, String]),
    __metadata("design:returntype", Promise)
], ItemsController.prototype, "toggleBatchStatus", null);
exports.ItemsController = ItemsController = __decorate([
    (0, common_1.Controller)('pharmacy/items'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [items_service_1.ItemsService])
], ItemsController);
//# sourceMappingURL=items.controller.js.map