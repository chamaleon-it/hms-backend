import { Module } from '@nestjs/common';
import { ReturnService } from './return.service';
import { ReturnController } from './return.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Return, ReturnSchema } from './schemas/return.schema';
import { ItemsModule } from '../items/items.module';
import { Billing, BillingSchema } from 'src/billing/schemas/billing.schema';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Return.name, schema: ReturnSchema }]),
    MongooseModule.forFeature([{ name: Billing.name, schema: BillingSchema }]),
    ItemsModule,
    UsersModule,
  ],
  controllers: [ReturnController],
  providers: [ReturnService],
})
export class ReturnModule { }
