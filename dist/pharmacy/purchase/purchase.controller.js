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
exports.PurchaseController = void 0;
const common_1 = require("@nestjs/common");
const purchase_service_1 = require("./purchase.service");
const create_purchase_dto_1 = require("./dto/create-purchase.dto");
const find_all_purchase_dto_1 = require("./dto/find-all-purchase.dto");
const auth_guard_1 = require("../../auth/auth.guard");
const get_user_decorator_1 = require("../../auth/decorators/get-user.decorator");
let PurchaseController = class PurchaseController {
    purchaseService;
    constructor(purchaseService) {
        this.purchaseService = purchaseService;
    }
    async createPurchase(createPurchaseDto, user) {
        createPurchaseDto.pharmacy = user.id;
        const data = await this.purchaseService.createPurchase(createPurchaseDto);
        return {
            data,
            message: 'Purchase order created successfully.',
        };
    }
    async findAll(findAllPurchaseDto) {
        const data = await this.purchaseService.findAll(findAllPurchaseDto);
        return {
            message: 'All purchase details fetched successfully',
            ...data,
        };
    }
};
exports.PurchaseController = PurchaseController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_purchase_dto_1.CreatePurchaseDto, Object]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "createPurchase", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [find_all_purchase_dto_1.FindAllPurchaseDto]),
    __metadata("design:returntype", Promise)
], PurchaseController.prototype, "findAll", null);
exports.PurchaseController = PurchaseController = __decorate([
    (0, common_1.Controller)('pharmacy/purchase'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [purchase_service_1.PurchaseService])
], PurchaseController);
//# sourceMappingURL=purchase.controller.js.map