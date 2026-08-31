import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CounterDocument = HydratedDocument<Counter>;

@Schema({
  versionKey: false,
  timestamps: true,
  strict: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Counter {
  /**
   * Unique identifier/key for the entity (e.g. 'patient', 'order', 'billing', 'sku', etc.)
   */
  @Prop({ required: true, unique: true, trim: true, index: true })
  key: string;

  /**
   * Current counter/sequence value
   */
  @Prop({ required: true, default: 0 })
  value: number;

  /**
   * Optional prefix for formatted identifiers (e.g. 'ORD-', 'INV-', etc.)
   */
  @Prop({ required: false, default: null, trim: true })
  prefix?: string;

  /**
   * Optional description or notes for the counter
   */
  @Prop({ required: false, default: null, trim: true })
  description?: string;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);

// Ensure index on key
CounterSchema.index({ key: 1 }, { unique: true });
