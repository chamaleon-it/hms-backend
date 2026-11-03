"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingModule = void 0;
const common_1 = require("@nestjs/common");
const billing_service_1 = require("./billing.service");
const billing_controller_1 = require("./billing.controller");
const mongoose_1 = require("@nestjs/mongoose");
const billing_schema_1 = require("./schemas/billing.schema");
const billingItem_schema_1 = require("./schemas/billingItem.schema");
const users_module_1 = require("../users/users.module");
const order_schema_1 = require("../pharmacy/orders/schemas/order.schema");
const accounts_module_1 = require("../accounts/accounts.module");
let BillingModule = class BillingModule {
};
exports.BillingModule = BillingModule;
exports.BillingModule = BillingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: billing_schema_1.Billing.name, schema: billing_schema_1.BillingSchema }]),
            mongoose_1.MongooseModule.forFeature([
                { name: billingItem_schema_1.BillingItem.name, schema: billingItem_schema_1.BillingItemSchema },
            ]),
            mongoose_1.MongooseModule.forFeature([{ name: order_schema_1.Order.name, schema: order_schema_1.OrderSchema }]),
            users_module_1.UsersModule,
            (0, common_1.forwardRef)(() => accounts_module_1.AccountsModule),
        ],
        controllers: [billing_controller_1.BillingController],
        providers: [billing_service_1.BillingService],
        exports: [billing_service_1.BillingService],
    })
], BillingModule);
//# sourceMappingURL=billing.module.js.map