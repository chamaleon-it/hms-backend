import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TherapyDocument = HydratedDocument<Therapy>;

@Schema({ timestamps: true, versionKey: false })
export class Therapy {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
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

export const TherapySchema = SchemaFactory.createForClass(Therapy);
