import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type AppointmentDocument = HydratedDocument<Appointment>;

export enum AppointmentType {
  NEW = 'New',
  FOLLOW_UP = 'Follow up',
}

export enum AppointmentStatus {
  UPCOMING = 'Upcoming',
  CONSULTED = 'Consulted',
  NOT_SHOW = 'Not show',
}

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Appointment {
  /** Sequential appointment id (CountersService key: appointment). */
  @Prop({ required: false, unique: true, sparse: true })
  mrn?: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' })
  patient: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  doctor: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  createdBy: mongoose.Types.ObjectId;

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

  @Prop({
    default: false,
  })
  isDeleted: boolean;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
