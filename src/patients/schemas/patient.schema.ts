import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type PatientDocument = HydratedDocument<Patient>;

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
  PREFER_NOT_TO_SAY="Prefer not to say"
}

export enum PatientStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  CRITICAL = 'Critical',
  DISCHARGED = 'Discharged',
  DELETED = 'Deleted',
}

@Schema({ versionKey: false, timestamps: true })
export class Patient {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  phoneNumber: string;

  @Prop({ trim: true, lowercase: true })
  email: string;

  @Prop({ enum: Object.values(Gender) })
  gender: Gender;

  @Prop({ required: true })
  dateOfBirth: Date;

  @Prop({ default: [], type: [String] })
  conditions: string[];

  @Prop({ enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] })
  blood: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

  @Prop()
  allergies: string;

  @Prop()
  insurance: string;

  @Prop()
  insuranceValidity: Date;

  @Prop()
  uhid: string;

  @Prop()
  emergencyContactNumber: string;

  @Prop()
  address: string;

  @Prop()
  notes: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  createdBy: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  doctor: mongoose.Types.ObjectId;

  @Prop({ enum: Object.values(PatientStatus), default: PatientStatus.ACTIVE })
  status: PatientStatus;

  @Prop({ required: true, unique: true })
  mrn: string;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);
