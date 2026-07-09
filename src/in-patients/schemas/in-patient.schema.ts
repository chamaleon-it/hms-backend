import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Patient } from '../../patients/schemas/patient.schema';

export type InPatientDocument = InPatient & Document;

export enum IPStatus {
  ADMITTED = 'Admitted',
  OBSERVATION = 'Under Observation',
  SURGERY = 'Surgery',
  DISCHARGED = 'Discharged',
}

@Schema({ timestamps: true })
export class InPatient {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Patient', required: true })
  patientId: Patient;

  @Prop({ required: true, unique: true })
  admissionNumber: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  doctorId: User;

  @Prop({ required: true })
  room: string;

  @Prop({ required: true })
  ward: string;

  @Prop({ required: true })
  bed: string;

  @Prop()
  diagnosis: string;

  @Prop()
  notes: string;

  @Prop({ type: Date, required: true, default: Date.now })
  admissionDate: Date;

  @Prop({ type: Date })
  dischargeDate: Date;

  @Prop({ required: true, enum: IPStatus, default: IPStatus.ADMITTED })
  status: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  createdBy: User;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy: User;
}

export const InPatientSchema = SchemaFactory.createForClass(InPatient);
