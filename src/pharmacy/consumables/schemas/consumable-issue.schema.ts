import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ConsumableIssueDocument = HydratedDocument<ConsumableIssue>;

@Schema({ timestamps: true, versionKey: false })
export class ConsumableIssue {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true })
  item: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  issuedBy: mongoose.Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: String, trim: true, default: null })
  department?: string | null;

  @Prop({ type: String, trim: true, default: null })
  note?: string | null;

  @Prop({ type: Number, required: true, min: 0 })
  unitPurchasePrice: number;

  @Prop({ type: Number, required: true, min: 0 })
  totalCost: number;
}

export const ConsumableIssueSchema =
  SchemaFactory.createForClass(ConsumableIssue);
