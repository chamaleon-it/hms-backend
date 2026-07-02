import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Appointment, AppointmentSchema } from '../appointments/schemas/appointment.schema';
import { Patient, PatientSchema } from '../patients/schemas/patient.schema';
import { Billing, BillingSchema } from '../billing/schemas/billing.schema';
import { BillingItem, BillingItemSchema } from '../billing/schemas/billingItem.schema';
import { BillingModule } from '../billing/billing.module';
// Import other schemas as needed for stats

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Billing.name, schema: BillingSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: BillingItem.name, schema: BillingItemSchema },
    ]),
    BillingModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
