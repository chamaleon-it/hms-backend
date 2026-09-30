import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type MedicalCertificateDocument = HydratedDocument<MedicalCertificate>;

export enum CertificateGender {
  MALE = 'Male',
  FEMALE = 'Female',
}

@Schema({ timestamps: true, versionKey: false })
export class MedicalCertificate {
  @Prop({ required: true, trim: true })
  patientName: string;

  @Prop({ required: true, trim: true })
  age: string;

  @Prop({ required: true, enum: Object.values(CertificateGender) })
  gender: CertificateGender;

  @Prop({ required: true, trim: true })
  reason: string;

  @Prop({ required: true, type: Date })
  dateFrom: Date;

  @Prop({ required: true, type: Date })
  dateTo: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  doctor: Types.ObjectId;

  @Prop({ required: true, trim: true })
  doctorName: string;

  @Prop({ required: true, trim: true })
  doctorQualification: string;

  @Prop({ required: true, trim: true })
  doctorRegistrationNumber: string;

  @Prop({ type: String, trim: true, default: null })
  doctorSignature?: string | null;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null,
  })
  patient?: Types.ObjectId | null;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  })
  createdBy?: Types.ObjectId | null;
}

export const MedicalCertificateSchema =
  SchemaFactory.createForClass(MedicalCertificate);
