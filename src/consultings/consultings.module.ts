import { Module } from '@nestjs/common';
import { ConsultingsService } from './consultings.service';
import { ConsultingsController } from './consultings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Consulting, ConsultingSchema } from './schemas/consulting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Consulting.name, schema: ConsultingSchema },
    ]),
  ],
  controllers: [ConsultingsController],
  providers: [ConsultingsService],
})
export class ConsultingsModule {}
