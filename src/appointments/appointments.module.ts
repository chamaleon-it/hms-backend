import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import { UsersModule } from 'src/users/users.module';
import { InPatient, InPatientSchema } from '../in-patients/schemas/in-patient.schema';
import { BillingModule } from 'src/billing/billing.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: InPatient.name, schema: InPatientSchema },
    ]),
    UsersModule,
    BillingModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
