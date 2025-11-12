import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Billing, BillingSchema } from './schemas/billing.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Billing.name, schema: BillingSchema }]),
  ],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
