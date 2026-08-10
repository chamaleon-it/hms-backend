import { Module } from '@nestjs/common';
import { TherapyService } from './therapy.service';
import { TherapyController } from './therapy.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Therapy, TherapySchema } from './schemas/therapy.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Therapy.name, schema: TherapySchema }]),
  ],
  controllers: [TherapyController],
  providers: [TherapyService],
})
export class TherapyModule {}
