import { Module } from '@nestjs/common';
import { PharmacyWholesalerService } from './pharmacy-wholesaler.service';
import { PharmacyWholesalerController } from './pharmacy-wholesaler.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports:[MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),],
  controllers: [PharmacyWholesalerController],
  providers: [PharmacyWholesalerService],
})
export class PharmacyWholesalerModule {}
