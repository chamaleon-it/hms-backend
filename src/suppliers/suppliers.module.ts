import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Supplier, SupplierSchema } from './schemas/supplier.schema';
import { PurchaseEntryModule } from './purchase_entry/purchase_entry.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Supplier.name, schema: SupplierSchema }]), PurchaseEntryModule],
  controllers: [SuppliersController],
  providers: [SuppliersService],
})
export class SuppliersModule { }
