import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ItemDocument = HydratedDocument<Item>;

export enum ItemStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Deleted = 'Deleted',
}

export enum BatchStatus {
  Active = 'active',
  Inactive = 'inactive',
}

/** Batch — pricing, stock, supplier, expiry, packing. */
@Schema({ _id: true, timestamps: false, versionKey: false })
export class ItemBatch {
  @Prop({ type: String, required: true, trim: true })
  batchNumber: string;

  @Prop({ type: Date, required: true })
  expiryDate: Date;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  mrp: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  purchaseRate: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  unitPrice: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  startingQuantity: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  quantity: number;

  @Prop({
    type: String,
    enum: BatchStatus,
    default: BatchStatus.Active,
  })
  status: BatchStatus;

  @Prop({ type: String, required: true, trim: true, default: '-' })
  supplier: string;

  @Prop({ type: Number, min: 0, default: 0 })
  packing?: number;

  @Prop({ type: Number, min: 0, default: 0 })
  stripCount?: number;

  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  gst?: number;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

/**
 * Item master — identity + category metadata only.
 * All pricing / stock / expiry / supplier / packing live on batches.
 */
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

  @Prop({ required: true, trim: true, default: 'Medicine' })
  category: string;

  @Prop({ trim: true, default: '-' })
  manufacturer?: string;

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
  }[];

  @Prop({ type: String, default: '-' })
  rackLocation: string;

  @Prop({
    enum: ItemStatus,
    default: ItemStatus.Active,
  })
  status: ItemStatus;

  @Prop({
    type: [
      {
        batchNumber: { type: String, required: true },
        expiryDate: { type: Date, required: true },
        mrp: { type: Number, required: true, min: 0, default: 0 },
        purchaseRate: { type: Number, required: true, min: 0, default: 0 },
        unitPrice: { type: Number, required: true, min: 0, default: 0 },
        startingQuantity: { type: Number, required: true, min: 0, default: 0 },
        quantity: { type: Number, required: true, min: 0 },
        status: {
          type: String,
          enum: Object.values(BatchStatus),
          default: BatchStatus.Active,
        },
        supplier: { type: String, required: true, default: '-' },
        packing: { type: Number, min: 0, default: 0 },
        stripCount: { type: Number, min: 0, default: 0 },
        gst: { type: Number, min: 0, max: 100, default: 0 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  batches: ItemBatch[];
}

export const ItemSchema = SchemaFactory.createForClass(Item);
