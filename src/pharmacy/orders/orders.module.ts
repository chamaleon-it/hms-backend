import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { ItemsModule } from '../items/items.module';
import { BillingModule } from 'src/billing/billing.module';
import { UsersModule } from 'src/users/users.module';
import { Patient, PatientSchema } from 'src/patients/schemas/patient.schema';
import { Billing, BillingSchema } from 'src/billing/schemas/billing.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: Billing.name, schema: BillingSchema },
    ]),
    ItemsModule,
    BillingModule,
    UsersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
