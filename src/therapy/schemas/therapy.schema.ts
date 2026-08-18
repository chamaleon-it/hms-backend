import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type TherapyDocument = HydratedDocument<Therapy>;

@Schema({ timestamps: true, versionKey: false })
export class SubTherapy {
  @Prop({ type: mongoose.Schema.Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop({ required: false })
  code?: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ default: 'Active' })
  status: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const SubTherapySchema = SchemaFactory.createForClass(SubTherapy);

@Schema({ timestamps: true, versionKey: false })
export class Therapy {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  code?: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: false, default: 0 })
  price?: number;

  @Prop({ default: false })
  hasSubTherapies: boolean;

  @Prop({ type: [SubTherapySchema], default: [] })
  subTherapies: SubTherapy[];

  @Prop({ default: 'Active' })
  status: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const TherapySchema = SchemaFactory.createForClass(Therapy);
