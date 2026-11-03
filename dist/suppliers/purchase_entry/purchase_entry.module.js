"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseEntryModule = void 0;
const common_1 = require("@nestjs/common");
const purchase_entry_service_1 = require("./purchase_entry.service");
const purchase_entry_controller_1 = require("./purchase_entry.controller");
const mongoose_1 = require("@nestjs/mongoose");
const purchase_entry_schema_1 = require("./schemas/purchase-entry.schema");
const supplier_payment_schema_1 = require("./schemas/supplier-payment.schema");
const items_module_1 = require("../../pharmacy/items/items.module");
const supplier_schema_1 = require("../schemas/supplier.schema");
const accounts_module_1 = require("../../accounts/accounts.module");
let PurchaseEntryModule = class PurchaseEntryModule {
};
exports.PurchaseEntryModule = PurchaseEntryModule;
exports.PurchaseEntryModule = PurchaseEntryModule = __decorate([
    (0, common_1.Module)({
        controllers: [purchase_entry_controller_1.PurchaseEntryController],
        providers: [purchase_entry_service_1.PurchaseEntryService],
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: purchase_entry_schema_1.PurchaseEntry.name, schema: purchase_entry_schema_1.PurchaseEntrySchema },
                { name: supplier_payment_schema_1.SupplierPayment.name, schema: supplier_payment_schema_1.SupplierPaymentSchema },
            ]),
            items_module_1.ItemsModule,
            mongoose_1.MongooseModule.forFeature([
                { name: supplier_schema_1.Supplier.name, schema: supplier_schema_1.SupplierSchema },
            ]),
            accounts_module_1.AccountsModule,
        ],
    })
], PurchaseEntryModule);
//# sourceMappingURL=purchase_entry.module.js.map