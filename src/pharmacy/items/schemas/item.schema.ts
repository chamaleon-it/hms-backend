import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ItemDocument = HydratedDocument<Item>;

export enum ItemStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Deleted = 'Deleted',
}

@Schema({ _id: true, timestamps: true, versionKey: false })
export class Batch {
  @Prop({ required: true, trim: true })
  batchNumber: string;

  @Prop({ type: Number, default: 0 })
  packing: number;

  @Prop({ type: Number, default: 0 })
  stripCount: number;

  @Prop({ type: Number, default: 0 })
  mrp: number;

  @Prop({ type: Number, default: 0 })
  unitPrice: number;

  @Prop({ type: Number, default: 0 })
  purchasePrice: number;

  @Prop({ type: Number, default: 0 })
  gst: number;

  @Prop({ type: Number, default: 0 })
  quantity: number;

  @Prop({ trim: true, default: '-' })
  supplier: string;

  @Prop({ type: Date })
  expiryDate: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}
export const BatchSchema = SchemaFactory.createForClass(Batch);

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
    default: 0,
    type: Number,
  })
  openingStockQuantity?: number;

  @Prop({
    type: Number,
    default: 0,
  })
  quantity: number;

  @Prop({
    type: Number,
    default: 0,
    required: true,
  })
  soldQuantity: number;

  @Prop({
    type: [
      {
        date: { type: Date, required: true },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true },
        customerName: { type: String },
        customerPhone: { type: String },
        doctorName: { type: String },
        pharmacistName: { type: String },
        patientMrn: { type: String },
      },
    ],
    default: [],
    required: true,
  })
  soldHistory: {
    date: Date;
    quantity: number;
    unitPrice: number;
    total: number;
    customerName?: string;
    customerPhone?: string;
    doctorName?: string;
    pharmacistName?: string;
    patientMrn?: string;
  }[];

  @Prop({ type: Date })
  expiryDate?: Date;

  @Prop({ type: String, default: '-' })
  rackLocation: string;

  @Prop({ type: Number, default: 0 })
  packing?: number;

  @Prop({ type: Number, default: 0 })
  noOfPacking?: number;

  @Prop({ type: Number, default: 0 })
  gst?: number;

  @Prop({
    enum: ItemStatus,
    default: ItemStatus.Active,
  })
  status: ItemStatus;

  @Prop({
    type: [BatchSchema],
    default: [],
  })
  batches: Batch[];
}

export const ItemSchema = SchemaFactory.createForClass(Item);
