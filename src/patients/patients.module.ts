import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Patient, PatientSchema } from './schemas/patient.schema';
import { CountersModule } from '../counters/counters.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Patient.name, schema: PatientSchema }]),
    CountersModule,
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
})
export class PatientsModule {}
