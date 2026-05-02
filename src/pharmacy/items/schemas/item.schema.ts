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
    default: '-',
  })
  hsnCode?: string;

  @Prop({
    required: true,
    trim: true,
    uppercase: true,
    unique: true,
  })
  sku: string;

  @Prop({ required: true, trim: true, default: 'Medicine' })
  category: string;

  @Prop({ trim: true, default: '-' })
  supplier?: string;

  @Prop({ trim: true, default: '-' })
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
    min: [0, 'MRP cannot be negative'],
  })
  mrp: number;

  @Prop({
    required: true,
    type: Number,
    min: [0, 'Unit price cannot be negative'],
  })
  purchasePrice: number;

  @Prop({
    default: 0,
    type: Number,
    min: [0, 'Opening stock cannot be negative'],
  })
  openingStockQuantity: number;

  @Prop({
    type: Number,
    default: 0,
  })
  quantity: number;

  @Prop({
    type: Number,
    default: 0,
    required: true
  })
  soldQuantity: number;

  @Prop({
    type: [{
      date: { type: Date, required: true },
      quantity: { type: Number, required: true },
    }],
    default: [],
    required: true
  })
  soldHistory: { date: Date, quantity: number }[];

  @Prop({ type: Date })
  expiryDate?: Date;

  @Prop({ type: String, default: '-' })
  rackLocation: string;

  @Prop({ type: Number, default: 0 })
  packing: number;

  @Prop({ type: Number, default: 0 })
  gst: number;

  @Prop({
    enum: ItemStatus,
    default: ItemStatus.Active,
  })
  status: ItemStatus;

  @Prop({
    type: [
      {
        batchNumber: { type: String, required: true },
        quantity: { type: Number, required: true },
        expiryDate: { type: Date, required: true },
        purchasePrice: { type: Number, required: true },
        supplier: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  batches: {
    batchNumber: string;
    quantity: number;
    expiryDate: Date;
    purchasePrice: number;
    supplier: string;
    createdAt: Date;
  }[];
}

export const ItemSchema = SchemaFactory.createForClass(Item);
