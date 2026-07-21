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

  @Prop({ type: String, default: 'Self' })
  doctor: string;

  @Prop({ type: [BillingItemSchema], default: [] })
  items: BillingItem[];

  @Prop({ type: Number, default: 0 })
  cash: number;

  @Prop({ type: Number, default: 0 })
  card: number;

  @Prop({ type: Number, default: 0 })
  upi: number;

  @Prop({ type: Number, default: 0 })
  discount: number;



  @Prop({ type: String, required: false })
  note?: string;

  @Prop({ type: String, required: true, unique: true })
  mrn: string;

  @Prop({ type: Boolean, required: true, default: false })
  roundOff: boolean;

  @Prop({
    type: String,
    enum: ['Sale', 'Return', 'Refund'],
    default: 'Sale',
  })
  transactionType: 'Sale' | 'Return' | 'Refund';

  @Prop({ type: String, required: false })
  salesMRN?: string;

  @Prop({ type: String, enum: ['Draft', 'Completed'], default: 'Draft' })
  status: 'Draft' | 'Completed';

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Report', required: false })
  reportId?: Types.ObjectId;
}

export const BillingSchema = SchemaFactory.createForClass(Billing);
