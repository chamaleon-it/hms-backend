import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Model, Types } from 'mongoose';
import configuration from 'src/config/configuration';

export type ReportDocument = HydratedDocument<Report>;



export enum ReportStatus {
  UPCOMING = 'Upcoming',
  SAMPLE_COLLECTED = 'Sample Collected',
  WAITING_FOR_RESULT = 'Waiting For Result',
  COMPLETED = 'Completed',
}

@Schema({ versionKey: false, timestamps: true })
export class Report {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  })
  patient: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null })
  doctor: Types.ObjectId | null;

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
  panels: string[];

  @Prop([
    {
      name: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
      value: { type: mongoose.Schema.Types.Mixed, default: '' },
    },
  ])
  test: {
    name: mongoose.Types.ObjectId;
    value: string | number;
  }[];

  @Prop({
    type: String,
    default: null,
  })
  sampleType: string | null;

  @Prop({
    type: Date,
    default: null,
  })
  sampleCollectedAt: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  testStartedAt: Date | null;

  @Prop({
    type: String,
    default: null,
  })
  sampleId: string | null;

  @Prop({
    type: Number,
    default: 0,
  })
  extraTime: number; // in minutes

  @Prop({
    type: String,
    enum: Object.values(ReportStatus),
    default: ReportStatus.UPCOMING,
  })
  status: ReportStatus;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: false })
  isFlagged: boolean;

  @Prop({ type: Number, unique: true })
  mrn: number;

  @Prop({ type: String, default: null })
  technician: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  graphs: Record<string, string>;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

ReportSchema.pre('save', async function (next) {
  if (this.isNew) {
    const model = this.constructor as Model<ReportDocument>;

    const lastReport = await model
      .findOne()
      .sort({ mrn: -1 })
      .select('mrn')
      .lean();

    this.mrn = lastReport ? lastReport.mrn + 1 : 1;
  }

  next();
});
