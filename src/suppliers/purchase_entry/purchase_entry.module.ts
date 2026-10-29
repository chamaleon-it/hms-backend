import { Module } from '@nestjs/common';
import { PurchaseEntryService } from './purchase_entry.service';
import { PurchaseEntryController } from './purchase_entry.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PurchaseEntry,
  PurchaseEntrySchema,
} from './schemas/purchase-entry.schema';
import {
  SupplierPayment,
  SupplierPaymentSchema,
} from './schemas/supplier-payment.schema';
import { ItemsModule } from 'src/pharmacy/items/items.module';
import { Supplier, SupplierSchema } from '../schemas/supplier.schema';
import { AccountsModule } from 'src/accounts/accounts.module';

@Module({
  controllers: [PurchaseEntryController],
  providers: [PurchaseEntryService],
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseEntry.name, schema: PurchaseEntrySchema },
      { name: SupplierPayment.name, schema: SupplierPaymentSchema },
    ]),
    ItemsModule,
    MongooseModule.forFeature([
      { name: Supplier.name, schema: SupplierSchema },
    ]),
    AccountsModule,
  ],
})
export class PurchaseEntryModule {}
