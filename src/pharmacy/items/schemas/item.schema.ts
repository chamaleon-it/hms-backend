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
 * Batch-level pricing, stock, supplier, expiry, packing.
 * Canonical sale field is `unitPrice` (legacy Atlas docs may still have `saleRate`).
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

  /** Canonical sale / unit rate for this batch (replaces saleRate). */
  @Prop({ type: Number, required: true, min: 0, default: 0 })
  unitPrice: number;

  /**
   * Legacy Atlas dual-read. Prefer unitPrice; do not write on new saves.
   * resolveUnitPrice reads unitPrice ?? saleRate ?? sellingPrice.
   */
  @Prop({ type: Number, min: 0 })
  saleRate?: number;

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

/**
 * Item master — identity + category metadata only.
 * Pricing / supplier / packing / opening stock live on batches.
 *
 * Retained operational denorm (not pricing):
 * - sku: auto-generated unique identity / search key
 * - quantity: sum of active batch quantities (stock filters / list)
 * - expiryDate: earliest active batch expiry (expiry filters)
 *
 * Removed from Item (were incorrectly master-level):
 * supplier, unitPrice, mrp, purchasePrice, openingStockQuantity,
 * packing, noOfPacking. Legacy Atlas docs may still contain them;
 * lean() dual-read is OK — do not write them on new saves.
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

  /** System identity — auto-generated; not user-editable pricing. */
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
  manufacturer?: string;

  /**
   * Aggregate stock = sum of active batch quantities (recalculated on batch
   * mutations). Kept for list/filter performance — not a pricing field.
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

  /** Earliest expiry among active batches (denormalized for filters). */
  @Prop({ type: Date })
  expiryDate?: Date;

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
        purchasePrice: { type: Number, min: 0 },
        unitPrice: { type: Number, required: true, min: 0, default: 0 },
        saleRate: { type: Number, min: 0 },
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
