"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportModule = void 0;
const common_1 = require("@nestjs/common");
const report_service_1 = require("./report.service");
const report_controller_1 = require("./report.controller");
const mongoose_1 = require("@nestjs/mongoose");
const report_schema_1 = require("./schemas/report.schema");
const test_schema_1 = require("../panels/schemas/test.schema");
const patient_schema_1 = require("../../patients/schemas/patient.schema");
const panel_schema_1 = require("../panels/schemas/panel.schema");
const group_schema_1 = require("../panels/schemas/group.schema");
const billing_module_1 = require("../../billing/billing.module");
let ReportModule = class ReportModule {
};
exports.ReportModule = ReportModule;
exports.ReportModule = ReportModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: report_schema_1.Report.name, schema: report_schema_1.ReportSchema },
                { name: test_schema_1.Test.name, schema: test_schema_1.TestSchema },
                { name: patient_schema_1.Patient.name, schema: patient_schema_1.PatientSchema },
                { name: panel_schema_1.Panel.name, schema: panel_schema_1.PanelSchema },
                { name: group_schema_1.Group.name, schema: group_schema_1.GroupSchema },
            ]),
            billing_module_1.BillingModule,
        ],
        controllers: [report_controller_1.ReportController],
        providers: [report_service_1.ReportService],
        exports: [report_service_1.ReportService],
    })
], ReportModule);
//# sourceMappingURL=report.module.js.map