import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type PatientDocument = HydratedDocument<Patient>;

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

@Schema({ versionKey: false, timestamps: true })
export class Patient {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  phoneNumber: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ enum: Object.values(Gender) })
  gender: Gender;

  @Prop({ required: true })
  age: number;

  @Prop()
  condition: string;

  @Prop({ enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] })
  blood: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

  @Prop()
  allergies: string;

  @Prop()
  address: string;

  @Prop()
  notes: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  createdBy: mongoose.Types.ObjectId;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
