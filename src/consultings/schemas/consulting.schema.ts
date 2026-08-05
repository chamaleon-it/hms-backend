import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import configuration from 'src/config/configuration';

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

  @Prop({
    type: {
      sleep: { type: String, default: null },
      bowelMovement: { type: String, default: null },
      urineMovement: { type: String, default: null },
      appetite: { type: String, default: null },
    },
    required: false,
  })
  medicalParameters?: {
    sleep: string | null;
    bowelMovement: string | null;
    urineMovement: string | null;
    appetite: string | null;
  };

  @Prop([
    {
      name: {
        type: Types.ObjectId,
        ref: 'Item',
        required: false,
        default: null,
      },
      referralName: { type: String, default: '' },
      isCustom: { type: Boolean, default: false },
      dosage: { type: String, required: true },
      frequency: { type: String, required: true },
      food: { type: String, required: true },
      duration: { type: String, required: true },
      quantity: { type: Number, required: true },
    },
  ])
  medicines: {
    name?: Types.ObjectId | null;
    referralName?: string;
    isCustom?: boolean;
    dosage: string;
    frequency: string;
    food: string;
    duration: string;
    quantity: number;
  }[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Therapy' }],
    default: [],
  })
  therapy: mongoose.Types.ObjectId[];


  @Prop({ type: String, default: null })
  therapyNotes: string | null;

  @Prop({ type: String, default: null })
  advice: string | null;

  @Prop({ type: Date, default: null })
  followUp: Date | null;

  @Prop([
    {
      name: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }],
      date: { type: Date, required: true },
      lab: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        default: configuration().in_house_lab_id,
        ref: 'User',
      },
      priority: { type: String, required: true },
    },
  ])
  test: {
    name: {
      code: string;
      max?: number;
      min?: number;
      name: string;
      type: 'Lab' | 'Imaging';
      unit: string;
      _id: mongoose.Types.ObjectId;
    }[];
    date: Date;
    lab: mongoose.Types.ObjectId;
    priority: string;
  }[];

  @Prop({ type: String, default: 'standard' })
  consultationType?: string;

  @Prop({
    type: {
      complaints: [{ type: String }],
      other: { type: String, default: null },
      duration: { type: String, default: null },
      painScore: { type: Number, default: null },
    },
    required: false,
  })
  chiefComplaints?: {
    complaints: string[];
    other: string | null;
    duration: string | null;
    painScore: number | null;
  };

  @Prop({
    type: {
      sleep: { type: String, default: null },
      bowel: { type: String, default: null },
      appetite: { type: String, default: null },
      stress: { type: String, default: null },
      exercise: { type: String, default: null },
      smoking: { type: String, default: null },
      alcohol: { type: String, default: null },
      micturition: { type: String, default: null },
    },
    required: false,
  })
  lifestyle?: {
    sleep: string | null;
    bowel: string | null;
    appetite: string | null;
    stress: string | null;
    exercise: string | null;
    smoking: string | null;
    alcohol: string | null;
    micturition: string | null;
  };

  @Prop({
    type: {
      clinicalDiagnosis: { type: String, default: null },
      treatmentPrinciple: { type: String, default: null },
    },
    required: false,
  })
  acupunctureAssessment?: {
    clinicalDiagnosis: string | null;
    treatmentPrinciple: string | null;
  };

  @Prop({
    type: {
      sessions: { type: String, default: null },
      frequency: { type: String, default: null },
      homeCare: [{ type: String }],
    },
    required: false,
  })
  treatmentPlan?: {
    sessions: string | null;
    frequency: string | null;
    homeCare: string[];
  };

  @Prop({
    type: {
      medHistory: [{ type: String }],
      otherMedHistory: { type: String, default: null },
      currentMedications: { type: String, default: null },
      allergies: { type: String, default: null },
    },
    required: false,
  })
  medicalHistoryDetails?: {
    medHistory: string[];
    otherMedHistory: string | null;
    currentMedications: string | null;
    allergies: string | null;
  };

  @Prop({
    type: {
      bp: { type: String, default: null },
      pulse: { type: String, default: null },
      tenderness: { type: String, default: null },
      rom: { type: String, default: null },
      posture: { type: String, default: null },
      specialFindings: { type: String, default: null },
    },
    required: false,
  })
  acupunctureExamination?: {
    bp: string | null;
    pulse: string | null;
    tenderness: string | null;
    rom: string | null;
    posture: string | null;
    specialFindings: string | null;
  };

  @Prop({
    type: {
      treatments: [{ type: String }],
      acuPoints: { type: String, default: null },
      retentionTime: { type: String, default: null },
    },
    required: false,
  })
  treatmentGiven?: {
    treatments: string[];
    acuPoints: string | null;
    retentionTime: string | null;
  };

  @Prop({
    type: {
      nextAppt: { type: Date, default: null },
      feedback: { type: String, default: null },
      additionalNotes: { type: String, default: null },
      signature: { type: String, default: null },
    },
    required: false,
  })
  followUpDetails?: {
    nextAppt: Date | null;
    feedback: string | null;
    additionalNotes: string | null;
    signature: string | null;
  };
}

export const ConsultingSchema = SchemaFactory.createForClass(Consulting);
