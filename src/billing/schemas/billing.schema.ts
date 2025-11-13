import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

@Schema({ _id: false, versionKey: false })
export class BillingItem {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, type: Number, default: 1 })
  quantity: number;

  @Prop({ required: true, type: Number, default: 0 })
  unitPrice: number;

  @Prop({ required: true, type: Number, default: 0 })
  gst: number;

  @Prop({ required: true, type: Number, default: 0 })
  discount: number;

  @Prop({ required: true, type: Number, default: 0 })
  total: number;
}
export const BillingItemSchema = SchemaFactory.createForClass(BillingItem);

export type BillingDocument = Billing & Document;

@Schema({ timestamps: true, versionKey: false })
export class Billing {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true })
  patient: Types.ObjectId;

  @Prop({ type: [BillingItemSchema], default: [] })
  items: BillingItem[];

  @Prop({ type: Number, default: 0 })
  cash: number;

  @Prop({ type: Number, default: 0 })
  online: number;

  @Prop({ type: Number, default: 0 })
  insurance: number;

  @Prop({ type: String, required: false })
  payer?: string;

  @Prop({ type: String, required: false })
  policyNo?: string;

  @Prop({ type: String, required: false })
  tpa?: string;

  @Prop({ type: String, required: false })
  preAuthNo?: string;

  @Prop({ type: String, required: false })
  note?: string;

  @Prop({ type: String, required: true, unique: true })
  mrn: string;
}

export const BillingSchema = SchemaFactory.createForClass(Billing);
