import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CounterDocument = HydratedDocument<Counter>;

/**
 * Atomic sequence counters. One document per logical key.
 * Keys: patient_pid | pharmacy_order | pharmacy_purchase | invoice:<PREFIX> | lab_report
 */
@Schema({ collection: 'counters', timestamps: true })
export class Counter {
  @Prop({ required: true, unique: true, trim: true })
  key: string;

  /** Last issued sequence value (next call returns seq+1). */
  @Prop({ required: true, default: 0, min: 0 })
  seq: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
