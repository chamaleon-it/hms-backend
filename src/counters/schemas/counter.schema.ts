import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CounterDocument = HydratedDocument<Counter>;

/**
 * Atomic sequence counters. One document per logical key.
 * Keys: patient_pid | pharmacy_order | pharmacy_purchase | invoice:<PREFIX> | lab_report
 *
 * Legacy DBs may still have a unique `name_1` index from an older shape.
 * We keep `name` mirrored to `key` so nulls never collide under that index
 * until CountersService.onModuleInit drops it.
 */
@Schema({ collection: 'counters', timestamps: true })
export class Counter {
  @Prop({ required: true, unique: true, trim: true })
  key: string;

  /**
   * Compatibility mirror of `key`. Production may still have unique `name_1`;
   * leaving this unset caused E11000 `{ name: null }` on the second counter.
   */
  @Prop({ required: false, trim: true })
  name?: string;

  /** Last issued sequence value (next call returns seq+1). */
  @Prop({ required: true, default: 0, min: 0 })
  seq: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
