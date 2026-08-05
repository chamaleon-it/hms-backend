import { Module } from '@nestjs/common';
import { ConsultingsService } from './consultings.service';
import { ConsultingsController } from './consultings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Consulting, ConsultingSchema } from './schemas/consulting.schema';
import { OrdersModule } from 'src/pharmacy/orders/orders.module';
import { ReportModule } from 'src/lab/report/report.module';

import { Therapy, TherapySchema } from 'src/therapy/schemas/therapy.schema';
import { BillingModule } from 'src/billing/billing.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Consulting.name, schema: ConsultingSchema },
      { name: Therapy.name, schema: TherapySchema },
    ]),
    OrdersModule,
    ReportModule,
    BillingModule,
  ],

  controllers: [ConsultingsController],
  providers: [ConsultingsService],
})
export class ConsultingsModule {}
