import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EmployeeSalary,
  EmployeeSalarySchema,
} from './schemas/employee-salary.schema';
import { Employee, EmployeeSchema } from '../schemas/employee.schema';
import {
  EmployeeLeave,
  EmployeeLeaveSchema,
} from '../leave/schemas/employee-leave.schema';
import { EmployeeSalaryService } from './employee-salary.service';
import { EmployeeSalaryController } from './employee-salary.controller';
import { AccountsModule } from '../../accounts/accounts.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmployeeSalary.name, schema: EmployeeSalarySchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: EmployeeLeave.name, schema: EmployeeLeaveSchema },
    ]),
    AccountsModule,
  ],
  controllers: [EmployeeSalaryController],
  providers: [EmployeeSalaryService],
  exports: [EmployeeSalaryService],
})
export class EmployeeSalaryModule {}
