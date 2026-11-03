"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsultingsModule = void 0;
const common_1 = require("@nestjs/common");
const consultings_service_1 = require("./consultings.service");
const consultings_controller_1 = require("./consultings.controller");
const mongoose_1 = require("@nestjs/mongoose");
const consulting_schema_1 = require("./schemas/consulting.schema");
const orders_module_1 = require("../pharmacy/orders/orders.module");
const report_module_1 = require("../lab/report/report.module");
const therapy_schema_1 = require("../therapy/schemas/therapy.schema");
const therapy_module_1 = require("../therapy/therapy.module");
const procedure_schema_1 = require("../procedure/schemas/procedure.schema");
const procedure_module_1 = require("../procedure/procedure.module");
const billing_module_1 = require("../billing/billing.module");
const treatment_module_1 = require("../treatment/treatment.module");
let ConsultingsModule = class ConsultingsModule {
};
exports.ConsultingsModule = ConsultingsModule;
exports.ConsultingsModule = ConsultingsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: consulting_schema_1.Consulting.name, schema: consulting_schema_1.ConsultingSchema },
                { name: therapy_schema_1.Therapy.name, schema: therapy_schema_1.TherapySchema },
                { name: procedure_schema_1.Procedure.name, schema: procedure_schema_1.ProcedureSchema },
            ]),
            orders_module_1.OrdersModule,
            report_module_1.ReportModule,
            billing_module_1.BillingModule,
            procedure_module_1.ProcedureModule,
            therapy_module_1.TherapyModule,
            treatment_module_1.TreatmentModule,
        ],
        controllers: [consultings_controller_1.ConsultingsController],
        providers: [consultings_service_1.ConsultingsService],
    })
], ConsultingsModule);
//# sourceMappingURL=consultings.module.js.map