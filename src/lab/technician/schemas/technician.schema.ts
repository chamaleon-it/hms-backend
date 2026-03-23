import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TechnicianDocument = HydratedDocument<Technician>;

@Schema()
export class Technician {
  @Prop({ required: true })
  name: string;

  @Prop({ default: '-' })
  qualification: string;

  @Prop({ default: '-' })
  designation: string;

  @Prop({ default: '-' })
  licenseNumber: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: false })
  inCharge: boolean;
}

export const TechnicianSchema = SchemaFactory.createForClass(Technician);
