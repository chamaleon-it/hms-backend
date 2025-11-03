import { Module } from '@nestjs/common';
import { ConsultingsService } from './consultings.service';
import { ConsultingsController } from './consultings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Consulting, ConsultingSchema } from './schemas/consulting.schema';
import { OrdersModule } from 'src/pharmacy/orders/orders.module';
import { OrdersService } from 'src/pharmacy/orders/orders.service';
import { Order, OrderSchema } from 'src/pharmacy/orders/schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Consulting.name, schema: ConsultingSchema },
    ]),
    OrdersModule,
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  controllers: [ConsultingsController],
  providers: [ConsultingsService, OrdersService],
})
export class ConsultingsModule {}
