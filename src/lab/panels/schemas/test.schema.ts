import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type TestDocument = HydratedDocument<Test>;

export enum TestType {
  LAB = 'Lab',
  IMAGING = 'Imaging',
  OTHER = 'Other',
}

@Schema({ versionKey: false })
export class Test {
  @Prop({ required: true, unique: true, trim: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ enum: Object.values(TestType), default: TestType.LAB })
  type: TestType;

  @Prop({ default: null })
  estimatedTime: number;

  @Prop({ default: null })
  min: number;

  @Prop({ default: null })
  max: number;

  @Prop({ default: null })
  womenMin?: number;

  @Prop({ default: null })
  womenMax?: number;

  @Prop({ default: null })
  childMin?: number;

  @Prop({ default: null })
  childMax?: number;

  @Prop({ default: null })
  nbMin?: number;

  @Prop({ default: null })
  nbMax?: number;

  @Prop({ default: null, trim: true })
  unit: string;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Panel' })
  panels: mongoose.Types.ObjectId[];
}

export const TestSchema = SchemaFactory.createForClass(Test);
