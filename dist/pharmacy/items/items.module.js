"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsModule = void 0;
const common_1 = require("@nestjs/common");
const items_service_1 = require("./items.service");
const items_controller_1 = require("./items.controller");
const mongoose_1 = require("@nestjs/mongoose");
const item_schema_1 = require("./schemas/item.schema");
const users_module_1 = require("../../users/users.module");
let ItemsModule = class ItemsModule {
};
exports.ItemsModule = ItemsModule;
exports.ItemsModule = ItemsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: item_schema_1.Item.name, schema: item_schema_1.ItemSchema }]),
            users_module_1.UsersModule,
        ],
        controllers: [items_controller_1.ItemsController],
        providers: [items_service_1.ItemsService],
        exports: [items_service_1.ItemsService],
    })
], ItemsModule);
//# sourceMappingURL=items.module.js.map