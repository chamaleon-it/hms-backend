"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const admin_controller_1 = require("./admin.controller");
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("../users/schemas/user.schema");
const appointment_schema_1 = require("../appointments/schemas/appointment.schema");
const patient_schema_1 = require("../patients/schemas/patient.schema");
const billing_schema_1 = require("../billing/schemas/billing.schema");
const billingItem_schema_1 = require("../billing/schemas/billingItem.schema");
const billing_module_1 = require("../billing/billing.module");
const consulting_schema_1 = require("../consultings/schemas/consulting.schema");
const in_patient_schema_1 = require("../in-patients/schemas/in-patient.schema");
const report_schema_1 = require("../lab/report/schemas/report.schema");
const therapy_schema_1 = require("../therapy/schemas/therapy.schema");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: appointment_schema_1.Appointment.name, schema: appointment_schema_1.AppointmentSchema },
                { name: billing_schema_1.Billing.name, schema: billing_schema_1.BillingSchema },
                { name: patient_schema_1.Patient.name, schema: patient_schema_1.PatientSchema },
                { name: billingItem_schema_1.BillingItem.name, schema: billingItem_schema_1.BillingItemSchema },
                { name: consulting_schema_1.Consulting.name, schema: consulting_schema_1.ConsultingSchema },
                { name: in_patient_schema_1.InPatient.name, schema: in_patient_schema_1.InPatientSchema },
                { name: report_schema_1.Report.name, schema: report_schema_1.ReportSchema },
                { name: therapy_schema_1.Therapy.name, schema: therapy_schema_1.TherapySchema },
            ]),
            billing_module_1.BillingModule,
        ],
        controllers: [admin_controller_1.AdminController],
        providers: [admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map