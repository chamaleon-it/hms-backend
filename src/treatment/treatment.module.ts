import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Treatment, TreatmentSchema } from './schemas/treatment.schema';
import { TreatmentService } from './treatment.service';
import { TreatmentController } from './treatment.controller';
import { Employee, EmployeeSchema } from '../employee/schemas/employee.schema';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Treatment.name, schema: TreatmentSchema },
      { name: Employee.name, schema: EmployeeSchema },
    ]),
    BillingModule,
  ],
  controllers: [TreatmentController],
  providers: [TreatmentService],
  exports: [TreatmentService],
})
export class TreatmentModule {}
