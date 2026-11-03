"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnModule = void 0;
const common_1 = require("@nestjs/common");
const return_service_1 = require("./return.service");
const return_controller_1 = require("./return.controller");
const mongoose_1 = require("@nestjs/mongoose");
const return_schema_1 = require("./schemas/return.schema");
const items_module_1 = require("../items/items.module");
const billing_schema_1 = require("../../billing/schemas/billing.schema");
const users_module_1 = require("../../users/users.module");
const accounts_module_1 = require("../../accounts/accounts.module");
let ReturnModule = class ReturnModule {
};
exports.ReturnModule = ReturnModule;
exports.ReturnModule = ReturnModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: return_schema_1.Return.name, schema: return_schema_1.ReturnSchema }]),
            mongoose_1.MongooseModule.forFeature([{ name: billing_schema_1.Billing.name, schema: billing_schema_1.BillingSchema }]),
            items_module_1.ItemsModule,
            users_module_1.UsersModule,
            accounts_module_1.AccountsModule,
        ],
        controllers: [return_controller_1.ReturnController],
        providers: [return_service_1.ReturnService],
    })
], ReturnModule);
//# sourceMappingURL=return.module.js.map