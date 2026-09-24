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

/**
 * Batch-level pricing & stock. Item-level unitPrice/mrp/quantity/expiryDate
 * remain for dual-read / historical docs and are recalculated from active
 * batches by ItemsService (no destructive drops).
 */
@Schema({ _id: true, timestamps: false, versionKey: false })
export class ItemBatch {
  @Prop({ type: String, required: true, trim: true })
  batchNumber: string;

  @Prop({ type: Date, required: true })
  expiryDate: Date;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  mrp: number;

  /** Canonical purchase rate for this batch. */
  @Prop({ type: Number, required: true, min: 0, default: 0 })
  purchaseRate: number;

  /**
   * Legacy dual-read field. Prefer purchaseRate; kept so older documents
   * and clients that still send purchasePrice continue to work.
   */
  @Prop({ type: Number, min: 0 })
  purchasePrice?: number;

  /** Canonical sale / unit rate for this batch. */
  @Prop({ type: Number, required: true, min: 0, default: 0 })
  saleRate: number;

  /** Quantity when the batch was first created / last restocked. */
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

  /** Units per strip/bottle for this batch (batch-level packing). */
  @Prop({ type: Number, min: 0, default: 0 })
  packing?: number;

  /** Number of strips/bottles for this batch. */
  @Prop({ type: Number, min: 0, default: 0 })
  stripCount?: number;

  /** GST % applicable to this batch. */
  @Prop({ type: Number, min: 0, max: 100, default: 0 })
  gst?: number;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
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

  /**
   * Denormalized sale rate (from active batches / last mutation).
   * Prefer batch.saleRate at order time. Kept for dual-read of flat-priced
   * historical items — do not drop.
   */
  @Prop({
    required: true,
    type: Number,
    min: [0, 'Unit price cannot be negative'],
    default: 0,
  })
  unitPrice: number;

  /**
   * Denormalized MRP. Prefer batch.mrp. Kept for dual-read — do not drop.
   */
  @Prop({
    required: true,
    type: Number,
    min: [0, 'MRP cannot be negative'],
    default: 0,
  })
  mrp: number;

  /**
   * Denormalized purchase rate. Prefer batch.purchaseRate. Kept for dual-read.
   */
  @Prop({
    required: true,
    type: Number,
    min: [0, 'Unit price cannot be negative'],
    default: 0,
  })
  purchasePrice: number;

  @Prop({
    default: 0,
    type: Number,
    min: [0, 'Opening stock cannot be negative'],
  })
  openingStockQuantity: number;

  /**
   * Aggregate stock = sum of active batch quantities (recalculated on batch
   * mutations). Flat quantity remains for dual-read of batch-less items.
   */
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

  /** Earliest expiry among active batches (denormalized). */
  @Prop({ type: Date })
  expiryDate?: Date;

  @Prop({ type: String, default: '-' })
  rackLocation: string;

  @Prop({ type: Number, default: 1, min: 1 })
  packing: number;

  @Prop({ type: Number, default: 0 })
  noOfPacking: number;

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
        purchasePrice: { type: Number, min: 0 },
        saleRate: { type: Number, required: true, min: 0, default: 0 },
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
