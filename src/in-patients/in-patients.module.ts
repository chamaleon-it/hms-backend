import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InPatientsService } from './in-patients.service';
import { InPatientsController } from './in-patients.controller';
import { InPatient, InPatientSchema } from './schemas/in-patient.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: InPatient.name, schema: InPatientSchema }])],
  controllers: [InPatientsController],
  providers: [InPatientsService],
})
export class InPatientsModule {}
