import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Billing, BillingSchema } from './schemas/billing.schema';
import { BillingItem, BillingItemSchema } from './schemas/billingItem.schema';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Billing.name, schema: BillingSchema }]),
    MongooseModule.forFeature([
      { name: BillingItem.name, schema: BillingItemSchema },
    ]),
    UsersModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
