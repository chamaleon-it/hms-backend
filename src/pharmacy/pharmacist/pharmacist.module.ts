import { Module } from '@nestjs/common';
import { PharmacistService } from './pharmacist.service';
import { PharmacistController } from './pharmacist.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Pharmacist, PharmacistSchema } from './schemas/pharmacist.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Pharmacist.name, schema: PharmacistSchema }])],
  controllers: [PharmacistController],
  providers: [PharmacistService],
})
export class PharmacistModule { }
