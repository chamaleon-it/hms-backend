import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { PharmacyWholesalerModule } from './pharmacy-wholesaler/pharmacy-wholesaler.module';
import { LabModule } from './lab/lab.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule,
    PharmacyModule,
    PharmacyWholesalerModule,
    LabModule
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
