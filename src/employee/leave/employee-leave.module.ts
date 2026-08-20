import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EmployeeLeave,
  EmployeeLeaveSchema,
} from './schemas/employee-leave.schema';
import { Employee, EmployeeSchema } from '../schemas/employee.schema';
import {
  EmployeeSalary,
  EmployeeSalarySchema,
} from '../salary/schemas/employee-salary.schema';
import { EmployeeLeaveService } from './employee-leave.service';
import { EmployeeLeaveController } from './employee-leave.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmployeeLeave.name, schema: EmployeeLeaveSchema },
      { name: Employee.name, schema: EmployeeSchema },
      { name: EmployeeSalary.name, schema: EmployeeSalarySchema },
    ]),
  ],
  controllers: [EmployeeLeaveController],
  providers: [EmployeeLeaveService],
  exports: [EmployeeLeaveService],
})
export class EmployeeLeaveModule {}
