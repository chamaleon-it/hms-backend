import { Module } from '@nestjs/common';
import { PurchaseEntryService } from './purchase_entry.service';
import { PurchaseEntryController } from './purchase_entry.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PurchaseEntry,
  PurchaseEntrySchema,
} from './schemas/purchase-entry.schema';
import { ItemsModule } from 'src/pharmacy/items/items.module';
import { Supplier, SupplierSchema } from '../schemas/supplier.schema';

@Module({
  controllers: [PurchaseEntryController],
  providers: [PurchaseEntryService],
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseEntry.name, schema: PurchaseEntrySchema },
    ]),
    ItemsModule,
    MongooseModule.forFeature([
      { name: Supplier.name, schema: SupplierSchema },
    ]),
  ],
})
export class PurchaseEntryModule {}
