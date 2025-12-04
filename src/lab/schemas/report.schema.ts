import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import configuration from 'src/config/configuration';

export type ReportDocument = HydratedDocument<Report>;

export enum SampleType {
  BLOOD = 'Blood',
  URINE = 'Urine',
  OTHER = 'Other',
}

export enum ReportStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  FLAGGED = 'Flagged',
  DELETED = 'Deleted',
}

@Schema({ versionKey: false, timestamps: true })
export class Report {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  })
  patient: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  doctor: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    default: configuration().in_house_lab_id,
  })
  lab: Types.ObjectId;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: String, required: true })
  priority: string;

  @Prop({ type: [String], default: [] })
  panels: string;

  @Prop([
    {
      code: { type: String, required: true },
      name: { type: String, required: true },
      unit: { type: String, required: true },
      min: { type: Number },
      max: { type: Number },
      panel: { type: String },
      type: { type: String, enum: ['Lab', 'Imaging'], required: true },
      _id: { type: mongoose.Schema.Types.ObjectId, required: true },
      value: { type: mongoose.Schema.Types.Mixed, default: '' },
    },
  ])
  name: {
    code: string;
    max?: number;
    min?: number;
    name: string;
    panel: string;
    type: 'Lab' | 'Imaging';
    unit: string;
    _id: mongoose.Types.ObjectId;
    value: string | number;
  }[];

  @Prop({
    type: String,
    enum: Object.values(SampleType),
    default: SampleType.OTHER,
  })
  sampleType: SampleType;

  @Prop({
    type: Date,
    default: null,
  })
  sampleCollectedAt: Date | null;

  @Prop({
    type: String,
    enum: Object.values(ReportStatus),
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
