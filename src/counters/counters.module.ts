import { Module } from '@nestjs/common';
import { CountersService } from './counters.service';
import { CountersController } from './counters.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { Patient, PatientSchema } from '../patients/schemas/patient.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Counter.name, schema: CounterSchema },
      { name: Patient.name, schema: PatientSchema },
    ]),
  ],
  controllers: [CountersController],
  providers: [CountersService],
  exports: [CountersService, MongooseModule],
})
export class CountersModule {}
