import { Module } from '@nestjs/common';
import { ConsultingsService } from './consultings.service';
import { ConsultingsController } from './consultings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Consulting, ConsultingSchema } from './schemas/consulting.schema';
import { OrdersModule } from 'src/pharmacy/orders/orders.module';
import { ReportModule } from 'src/lab/report/report.module';

import { Therapy, TherapySchema } from 'src/therapy/schemas/therapy.schema';
import { Procedure, ProcedureSchema } from 'src/procedure/schemas/procedure.schema';
import { ProcedureModule } from 'src/procedure/procedure.module';
import { BillingModule } from 'src/billing/billing.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Consulting.name, schema: ConsultingSchema },
      { name: Therapy.name, schema: TherapySchema },
      { name: Procedure.name, schema: ProcedureSchema },
    ]),
    OrdersModule,
    ReportModule,
    BillingModule,
    ProcedureModule,
  ],

  controllers: [ConsultingsController],
  providers: [ConsultingsService],
})
export class ConsultingsModule {}
