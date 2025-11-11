import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type PurchaseDocument = HydratedDocument<Purchase>;

@Schema({ timestamps: true, versionKey: false })
export class Purchase {
  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' })
  wholesaler: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' })
  pharmacy: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  contactPerson: string;

  @Prop({ type: String, required: true })
  phoneNumber: string;

  @Prop({ type: String, required: true })
  deliveryAddress: string;

  @Prop({ type: String, required: true })
  expectedDelivery: string;

  @Prop({ type: String, required: true })
  paymentTerms: string;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        unitPrice: { type: Number, required: true },
        quantity: { type: Number, required: true },
        notes: { type: String, default: null },
      },
    ],
    required: true,
  })
  items: {
    name: string;
    unitPrice: number;
    quantity: number;
    notes: null | string;
  }[];

  @Prop({
    type: Number,
    default: null,
  })
  shipping: number | null;

  @Prop({
    type: String,
    default: null,
  })
  instructions: string | null;

  @Prop({
    type: Boolean,
    default: false,
  })
  partialDelivery: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  urgent: boolean;

  @Prop({ required: true, unique: true })
  mrn: string;
}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);
