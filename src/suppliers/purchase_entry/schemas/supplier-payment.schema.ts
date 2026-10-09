import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ _id: false })
export class SupplierPaymentAllocation {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseEntry',
    required: true,
  })
  purchaseEntry: mongoose.Types.ObjectId;

  @Prop({ required: true })
  invoiceNumber: string;

  @Prop({ required: true, min: 0 })
  amount: number;
}

export const SupplierPaymentAllocationSchema = SchemaFactory.createForClass(
  SupplierPaymentAllocation,
);

@Schema({ timestamps: true, versionKey: false, collection: 'supplierpayments' })
export class SupplierPayment {
  @Prop({
    required: true,
    ref: 'Supplier',
    type: mongoose.Schema.Types.ObjectId,
  })
  supplier: mongoose.Types.ObjectId;

  @Prop({ required: true, default: 0, min: 0 })
  cash: number;

  @Prop({ required: true, default: 0, min: 0 })
  card: number;

  @Prop({ required: true, default: 0, min: 0 })
  upi: number;

  @Prop({ required: true, min: 0 })
  total: number;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ type: [SupplierPaymentAllocationSchema], default: [] })
  allocations: SupplierPaymentAllocation[];
}

export const SupplierPaymentSchema =
  SchemaFactory.createForClass(SupplierPayment);
