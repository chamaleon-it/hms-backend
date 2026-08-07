import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CounterDocument = HydratedDocument<Counter>;

@Schema({ versionKey: false })
export class Counter {
  @Prop({ required: true, unique: true })
  _id: string; // e.g. 'order_mrn', 'patient_mrn', 'bill_mrn', 'item_sku'

  @Prop({ required: true, default: 0 })
  seq: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
