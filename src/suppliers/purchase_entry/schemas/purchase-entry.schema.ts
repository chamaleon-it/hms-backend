import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export enum PaymentStatus {
  PENDING = 'Pending',
  PAID = 'Paid',
  PARTIALLY_PAID = 'Partially Paid',
}

@Schema({ timestamps: true, versionKey: false })
export class PurchaseEntry {
  @Prop({
    required: true,
    ref: 'Supplier',
    type: mongoose.Schema.Types.ObjectId,
  })
  supplier: mongoose.Types.ObjectId;

  @Prop({ required: true })
  invoiceNumber: string;

  @Prop({ required: true })
  invoiceDate: Date;

  @Prop({ default: true })
  gstEnabled: boolean;

  @Prop({ default: true })
  tscEnabled: boolean;

  @Prop([
    {
      item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true,
      },
      batch: { type: String, required: true },
      quantity: { type: Number, required: true },
      pack: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
      expiryDate: { type: Date, required: true },
      purchasePrice: { type: Number, required: true },
      gst: { type: Number, required: true },
      discount: { type: Number, required: true },
      free: { type: Number, required: true },
    },
  ])
  items: Array<{
    item: mongoose.Types.ObjectId;
    batch: string;
    quantity: number;
    pack: number;
    unitPrice: number;
    expiryDate: Date;
    purchasePrice: number;
    gst: number;
    discount: number;
    free: number;
  }>;

  @Prop({ default: 0 })
  subTotal: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  gst: number;

  @Prop({ default: 0 })
  transportCharge: number;

  @Prop({ default: 0 })
  total: number;

  @Prop({ default: 0 })
  paidAmount: number;

  @Prop({ type: String, required: false })
  description: string;

  @Prop({ default: PaymentStatus.PENDING, enum: PaymentStatus })
  paymentStatus: PaymentStatus;
}

export const PurchaseEntrySchema = SchemaFactory.createForClass(PurchaseEntry);
