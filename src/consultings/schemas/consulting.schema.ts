import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ConsultingDocument = HydratedDocument<Consulting>;

@Schema({ versionKey: false, timestamps: true })
export class Consulting {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' })
  patient: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' })
  appointment: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  doctor: mongoose.Types.ObjectId;

  @Prop({
    type: {
      presentHistory: { type: String, default: null },
      pastHistory: { type: String, default: null },
      diagnosis: { type: String, default: null },
    },
    required: true,
  })
  consultationNotes: {
    presentHistory: string | null;
    pastHistory: string | null;
    diagnosis: string | null;
  };

  @Prop({
    type: {
      hr: { type: String, default: null },
      bp: { type: String, default: null },
      spo2: { type: String, default: null },
      temp: { type: String, default: null },
      tempUnit: { type: String, default: null },
      rs: { type: String, default: null },
      cvs: { type: String, default: null },
      pa: { type: String, default: null },
      cns: { type: String, default: null },
      le: { type: String, default: null },
      otherNotes: { type: String, default: null },
    },
    required: true,
  })
  examinationNote: {
    hr: string | null;
    bp: string | null;
    spo2: string | null;
    temp: string | null;
    rs: string | null;
    cvs: string | null;
    pa: string | null;
    cns: string | null;
    otherNotes: string | null;
  };

  @Prop([
    {
      name: { type: Types.ObjectId, ref: 'Item', required: true },
      dosage: { type: String, required: true },
      frequency: { type: String, required: true },
      food: { type: String, required: true },
      duration: { type: String, required: true },
      quantity: { type: Number, required: true },
    },
  ])
  medicines: {
    name: Types.ObjectId;
    dosage: string;
    frequency: string;
    food: string;
    duration: string;
    quantity: number;
  }[];

  @Prop({ type: String, default: null })
  advice: string | null;

  @Prop({ type: Date, default: null })
  followUp: Date | null;

  @Prop([
    {
      name: [{ type: String, required: true }],
      date: { type: Date, required: true },
      lab: { type: String, required: true },
      slot: { type: String, required: true },
      priority: { type: String, required: true },
    },
  ])
  test: {
    name: string[];
    date: Date;
    lab: string;
    slot: string;
    priority: string;
  }[];
}

export const ConsultingSchema = SchemaFactory.createForClass(Consulting);
