"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeSalaryModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const employee_salary_schema_1 = require("./schemas/employee-salary.schema");
const employee_schema_1 = require("../schemas/employee.schema");
const employee_leave_schema_1 = require("../leave/schemas/employee-leave.schema");
const employee_salary_service_1 = require("./employee-salary.service");
const employee_salary_controller_1 = require("./employee-salary.controller");
const accounts_module_1 = require("../../accounts/accounts.module");
let EmployeeSalaryModule = class EmployeeSalaryModule {
};
exports.EmployeeSalaryModule = EmployeeSalaryModule;
exports.EmployeeSalaryModule = EmployeeSalaryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: employee_salary_schema_1.EmployeeSalary.name, schema: employee_salary_schema_1.EmployeeSalarySchema },
                { name: employee_schema_1.Employee.name, schema: employee_schema_1.EmployeeSchema },
                { name: employee_leave_schema_1.EmployeeLeave.name, schema: employee_leave_schema_1.EmployeeLeaveSchema },
            ]),
            accounts_module_1.AccountsModule,
        ],
        controllers: [employee_salary_controller_1.EmployeeSalaryController],
        providers: [employee_salary_service_1.EmployeeSalaryService],
        exports: [employee_salary_service_1.EmployeeSalaryService],
    })
], EmployeeSalaryModule);
//# sourceMappingURL=employee-salary.module.js.map