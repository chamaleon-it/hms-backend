import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, mongo } from 'mongoose';

export type TestDocument = HydratedDocument<Test>;

export enum TestType {
  LAB = 'Lab',
  IMAGING = 'Imaging',
  OTHER = 'Other',
}

@Schema()
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
  minimumValue: number;

  @Prop({ default: null })
  maximumValue: number;

  @Prop({ default: null, trim: true })
  unit: string;

  @Prop({ type:[mongoose.Schema.Types.ObjectId], ref:'Panel' })
  panels:mongoose.Types.ObjectId[];


}

export const TestSchema = SchemaFactory.createForClass(Test);
