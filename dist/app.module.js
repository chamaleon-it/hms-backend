"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const users_module_1 = require("./users/users.module");
const configuration_1 = __importDefault(require("./config/configuration"));
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const mongoose_1 = require("@nestjs/mongoose");
const auth_module_1 = require("./auth/auth.module");
const auth_guard_1 = require("./auth/auth.guard");
const appointments_module_1 = require("./appointments/appointments.module");
const patients_module_1 = require("./patients/patients.module");
const uploads_module_1 = require("./uploads/uploads.module");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const billing_module_1 = require("./billing/billing.module");
const consultings_module_1 = require("./consultings/consultings.module");
const items_module_1 = require("./pharmacy/items/items.module");
const orders_module_1 = require("./pharmacy/orders/orders.module");
const return_module_1 = require("./pharmacy/return/return.module");
const purchase_module_1 = require("./pharmacy/purchase/purchase.module");
const report_module_1 = require("./lab/report/report.module");
const panels_module_1 = require("./lab/panels/panels.module");
const backup_module_1 = require("./backup/backup.module");
const suppliers_module_1 = require("./suppliers/suppliers.module");
const admin_module_1 = require("./admin/admin.module");
const in_patients_module_1 = require("./in-patients/in-patients.module");
const therapy_module_1 = require("./therapy/therapy.module");
const procedure_module_1 = require("./procedure/procedure.module");
const accounts_module_1 = require("./accounts/accounts.module");
const employee_module_1 = require("./employee/employee.module");
const employee_leave_module_1 = require("./employee/leave/employee-leave.module");
const employee_salary_module_1 = require("./employee/salary/employee-salary.module");
const treatment_module_1 = require("./treatment/treatment.module");
const sync_module_1 = require("./sync/sync.module");
const tally_module_1 = require("./tally/tally.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 10,
                },
            ]),
            config_1.ConfigModule.forRoot({
                load: [configuration_1.default],
            }),
            mongoose_1.MongooseModule.forRoot((0, configuration_1.default)().databaseUrl),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(process.cwd(), 'uploads'),
                serveRoot: '/uploads',
            }),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            appointments_module_1.AppointmentsModule,
            patients_module_1.PatientsModule,
            uploads_module_1.UploadsModule,
            billing_module_1.BillingModule,
            consultings_module_1.ConsultingsModule,
            items_module_1.ItemsModule,
            orders_module_1.OrdersModule,
            return_module_1.ReturnModule,
            purchase_module_1.PurchaseModule,
            report_module_1.ReportModule,
            panels_module_1.PanelsModule,
            backup_module_1.BackupModule,
            suppliers_module_1.SuppliersModule,
            admin_module_1.AdminModule,
            in_patients_module_1.InPatientsModule,
            therapy_module_1.TherapyModule,
            procedure_module_1.ProcedureModule,
            accounts_module_1.AccountsModule,
            employee_module_1.EmployeeModule,
            employee_leave_module_1.EmployeeLeaveModule,
            employee_salary_module_1.EmployeeSalaryModule,
            treatment_module_1.TreatmentModule,
            sync_module_1.SyncModule,
            tally_module_1.TallyModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: auth_guard_1.JwtAuthGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map