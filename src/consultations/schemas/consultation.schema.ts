import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ConsultationDocument = HydratedDocument<Consultation>;

export enum ConsultationStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Consultation {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true })
  appointmentId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  doctorId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true })
  patientId: mongoose.Types.ObjectId;

  @Prop({ required: true, unique: true })
  roomId: string;

  @Prop({ required: true })
  meetingUrl: string;

  @Prop({
    required: true,
    enum: Object.values(ConsultationStatus),
    default: ConsultationStatus.PENDING,
  })
  status: ConsultationStatus;

  @Prop({ default: null })
  startedAt: Date;

  @Prop({ default: null })
  endedAt: Date;
}

export const ConsultationSchema = SchemaFactory.createForClass(Consultation);
