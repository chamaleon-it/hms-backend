import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type AppointmentDocument = HydratedDocument<Appointment>;

export enum AppointmentMethod {
  IN_CLINIC = 'In clinic',
  VIDEO = 'Video',
  PHONE = 'Phone',
}

export enum AppointmentType {
  NEW = 'New',
  FOLLOW_UP = 'Follow up',
}

export enum AppointmentStatus {
  UPCOMING = 'Upcoming',
  CONSULTED = 'Consulted',
  OBSERVATION = 'Observation',
  COMPLETED = 'Completed',
  NOT_SHOW = 'Not show',
}

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Appointment {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' })
  patient: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  doctor: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  createdBy: mongoose.Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(AppointmentMethod),
    default: AppointmentMethod.IN_CLINIC,
  })
  method: AppointmentMethod;

  @Prop({ required: true })
  date: Date;

  @Prop({ default: null })
  notes: string;

  @Prop({ default: null })
  internalNotes: string;

  @Prop({
    required: true,
    enum: Object.values(AppointmentType),
    default: AppointmentType.NEW,
  })
  type: AppointmentType;

  @Prop({
    required: true,
    enum: Object.values(AppointmentStatus),
    default: AppointmentStatus.UPCOMING,
  })
  status: AppointmentStatus;

  @Prop({
    default: false,
  })
  isPaid: boolean;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
