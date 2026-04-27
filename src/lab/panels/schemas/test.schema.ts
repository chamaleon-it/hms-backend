import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type TestDocument = HydratedDocument<Test>;

export enum TestType {
  LAB = 'Lab',
  IMAGING = 'Imaging',
  OTHER = 'Other',
}

@Schema()
export class RangeItem {
  @Prop()
  name: string;

  @Prop({ default: null })
  min?: number;

  @Prop({ default: null })
  max?: number;

  @Prop({ default: null })
  fromAge?: number;

  @Prop({ default: null })
  toAge?: number;

  @Prop({ enum: ['Both', 'Male', 'Female'] })
  gender: string;

  @Prop({ enum: ['Year', 'Month', 'Day'] })
  dateType: string;
}

@Schema({ versionKey: false })
export class Test {
  @Prop({ required: false, trim: true, default: null, type: String || null })
  code: string | null;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false, default: 0 })
  price: number;

  @Prop({ required: false, default: null, trim: true, type: String || null })
  method: string | null;

  @Prop({ required: false, default: null, trim: true, type: String || null })
  specimen: string | null;

  @Prop({ enum: Object.values(TestType), default: TestType.LAB })
  type: TestType;

  @Prop({ default: null })
  estimatedTime: number;

  @Prop({ default: 'number', enum: ['number', 'text', 'boolean', 'options'] })
  dataType: 'number' | 'text' | 'boolean' | 'options';

  @Prop({ type: [RangeItem], default: [] })
  range: RangeItem[];

  @Prop({ default: null, trim: true })
  unit: string;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Panel' })
  panels: mongoose.Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  options: string[];

  @Prop({ default: null })
  note: string;
}

export const TestSchema = SchemaFactory.createForClass(Test);
