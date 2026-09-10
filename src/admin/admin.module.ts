import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Billing, BillingSchema } from '../billing/schemas/billing.schema';
import { Patient, PatientSchema } from '../patients/schemas/patient.schema';
import { Pharmacist, PharmacistSchema } from '../pharmacy/pharmacist/schemas/pharmacist.schema';
import { Technician, TechnicianSchema } from '../lab/technician/schemas/technician.schema';
import { Appointment, AppointmentSchema } from '../appointments/schemas/appointment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Billing.name, schema: BillingSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: Pharmacist.name, schema: PharmacistSchema },
      { name: Technician.name, schema: TechnicianSchema },
      { name: Appointment.name, schema: AppointmentSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
