"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TallyModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const tally_controller_1 = require("./tally.controller");
const tally_service_1 = require("./tally.service");
const billing_module_1 = require("../billing/billing.module");
const tally_connection_schema_1 = require("./schemas/tally-connection.schema");
const account_transaction_schema_1 = require("../accounts/schemas/account-transaction.schema");
let TallyModule = class TallyModule {
};
exports.TallyModule = TallyModule;
exports.TallyModule = TallyModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: tally_connection_schema_1.TallyConnection.name, schema: tally_connection_schema_1.TallyConnectionSchema },
                { name: account_transaction_schema_1.AccountTransaction.name, schema: account_transaction_schema_1.AccountTransactionSchema },
            ]),
            (0, common_1.forwardRef)(() => billing_module_1.BillingModule),
        ],
        controllers: [tally_controller_1.TallyController],
        providers: [tally_service_1.TallyService],
        exports: [tally_service_1.TallyService],
    })
], TallyModule);
//# sourceMappingURL=tally.module.js.map