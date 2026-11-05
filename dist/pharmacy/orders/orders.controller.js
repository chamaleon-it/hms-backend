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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("./orders.service");
const mongoose_1 = __importDefault(require("mongoose"));
const auth_guard_1 = require("../../auth/auth.guard");
const get_user_decorator_1 = require("../../auth/decorators/get-user.decorator");
const create_order_dto_1 = require("./dto/create-order.dto");
const UpdateOrder_dto_1 = require("./dto/UpdateOrder.dto");
const get_customers_dto_1 = require("./dto/get-customers.dto");
const get_orders_dto_1 = require("./dto/get-orders.dto");
const update_payment_dto_1 = require("./dto/update-payment.dto");
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    async create(dto) {
        const data = await this.ordersService.createOrder(dto);
        return {
            message: 'Order created successfully',
            data,
        };
    }
    async getOrders(query) {
        const { data, total } = await this.ordersService.getOrders(query);
        return {
            data,
            total,
            page: Number(query.page),
            limit: Number(query.limit),
            message: 'All orders where retrieved successfully',
        };
    }
    async getSingleOrder(q) {
        const data = await this.ordersService.getSingleOrder(q);
        return {
            data,
            message: 'Single order were retrieved successfully',
        };
    }
    async deleteOrder(id) {
        const data = await this.ordersService.deleteOrder(id);
        return {
            data,
            message: 'Successfully removed the order',
        };
    }
    async getCustomers(query) {
        const { data, total } = await this.ordersService.getCustomers(query);
        return {
            data,
            total,
            page: Number(query.page),
            limit: Number(query.limit),
            message: 'All customers data were retrieved successfully.',
        };
    }
    async getCustomer(patient) {
        if (!mongoose_1.default.isValidObjectId(patient))
            throw new common_1.BadRequestException('Please provide a valid patient id');
        const data = await this.ordersService.getCustomer(new mongoose_1.default.Types.ObjectId(patient));
        return {
            data,
            message: 'Customer data were retrieved successfully.',
        };
    }
    async getOrdersByPatient(patient) {
        if (!mongoose_1.default.isValidObjectId(patient))
            throw new common_1.BadRequestException('Please provide a valid patient id');
        const data = await this.ordersService.getOrdersByPatient(new mongoose_1.default.Types.ObjectId(patient));
        return {
            data,
            message: 'Patient pharmacy orders retrieved successfully.',
        };
    }
    async updateOrder(dto) {
        const data = await this.ordersService.updateOrder(dto);
        return {
            message: 'Order updated successfully',
            data,
        };
    }
    async completeOrder(id, user) {
        const data = await this.ordersService.completeOrder(id, user?.id);
        return {
            message: 'Order completed successfully',
            data,
        };
    }
    async repeatOrder(id) {
        const data = await this.ordersService.repeatOrder(id);
        return {
            message: 'Order repeated successfully',
            data,
        };
    }
    async updatePayment(dto) {
        const data = await this.ordersService.updatePayment(dto);
        return {
            message: 'Payment updated successfully',
            data,
        };
    }
    async recoverOrder(id) {
        const data = await this.ordersService.recoverOrder(id);
        return {
            message: 'Order recovered successfully',
            data,
        };
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_order_dto_1.CreateOrderDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_orders_dto_1.GetOrdersDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('single'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getSingleOrder", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "deleteOrder", null);
__decorate([
    (0, common_1.Get)('customers'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_customers_dto_1.GetCustomersDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getCustomers", null);
__decorate([
    (0, common_1.Get)('customers/:patient'),
    __param(0, (0, common_1.Param)('patient')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getCustomer", null);
__decorate([
    (0, common_1.Get)('patient/:patient'),
    __param(0, (0, common_1.Param)('patient')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getOrdersByPatient", null);
__decorate([
    (0, common_1.Patch)('update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdateOrder_dto_1.UpdateOrderDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateOrder", null);
__decorate([
    (0, common_1.Patch)('complete/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "completeOrder", null);
__decorate([
    (0, common_1.Post)('repeat_order/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "repeatOrder", null);
__decorate([
    (0, common_1.Patch)('update_payment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_payment_dto_1.UpdatePaymentDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updatePayment", null);
__decorate([
    (0, common_1.Post)('recover/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mongoose_1.default.Types.ObjectId]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "recoverOrder", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.Controller)('pharmacy/orders'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map