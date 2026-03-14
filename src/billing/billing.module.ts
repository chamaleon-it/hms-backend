import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Billing, BillingSchema } from './schemas/billing.schema';
import { BillingItem, BillingItemSchema } from './schemas/billingItem.schema';
import { UsersModule } from 'src/users/users.module';
import { Order, OrderSchema } from 'src/pharmacy/orders/schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Billing.name, schema: BillingSchema }]),
    MongooseModule.forFeature([
      { name: BillingItem.name, schema: BillingItemSchema },
    ]),
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    UsersModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
