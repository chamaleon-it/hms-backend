import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ItemDocument = HydratedDocument<Item>;

export enum ItemStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Deleted = 'Deleted',
}

@Schema({ timestamps: true, versionKey: false })
export class Item {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  pharmacy: mongoose.Types.ObjectId;

  @Prop({ trim: true })
  generic?: string;

  @Prop({
    trim: true,
    match: [/^\d{4,8}$/, 'HSN code must be 4–8 digits'],
  })
  hsnCode?: string;

  @Prop({
    required: true,
    trim: true,
    uppercase: true,
    unique: true,
  })
  sku: string;

  @Prop({ required: true, trim: true })
  category: string;

  @Prop({ trim: true })
  supplier?: string;

  @Prop({ trim: true })
  manufacturer?: string;

  @Prop({
    required: true,
    type: Number,
    min: [0, 'Unit price cannot be negative'],
  })
  unitPrice: number;

  @Prop({
    required: true,
    type: Number,
    min: [0, 'Unit price cannot be negative'],
  })
  purchasePrice: number;

  @Prop({
    required: true,
    type: Number,
    min: [0, 'Opening stock cannot be negative'],
  })
  openingStockQuantity: number;

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Quantity cannot be negative'],
  })
  quantity: number;

  @Prop({ type: Date })
  expiryDate?: Date;

  @Prop({
    enum: ItemStatus,
    default: ItemStatus.Active,
  })
  status: ItemStatus;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
