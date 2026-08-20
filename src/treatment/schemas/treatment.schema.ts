import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type TreatmentDocument = HydratedDocument<Treatment>;

export enum TreatmentType {
  Therapy = 'Therapy',
  Procedure = 'Procedure',
  Combined = 'Combined',
}

export enum TreatmentStatus {
  Pending = 'Pending',
  InProgress = 'In-Progress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum TreatmentBillingStatus {
  Unbilled = 'Unbilled',
  Draft = 'Draft',
  Billed = 'Billed',
  Paid = 'Paid',
}

@Schema({ _id: false, versionKey: false })
export class TreatmentItem {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Therapy', required: false })
  therapyId?: Types.ObjectId;

  @Prop({ type: String, required: false })
  subTherapyId?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Procedure', required: false })
  procedureId?: Types.ObjectId;

  @Prop({ type: String, required: false })
  subProcedureId?: string;

  @Prop({ type: String, required: false })
  parentName?: string;

  @Prop({ type: String, required: false })
  code?: string;

  @Prop({ required: true, type: Number, default: 1 })
  quantity: number;

  @Prop({ required: true, type: Number, default: 0 })
  unitPrice: number;

  @Prop({ required: true, type: Number, default: 0 })
  gst: number;

  @Prop({ required: true, type: Number, default: 0 })
  discount: number;

  @Prop({ required: true, type: Number, default: 0 })
  total: number;
}

export const TreatmentItemSchema = SchemaFactory.createForClass(TreatmentItem);

@Schema({ timestamps: true, versionKey: false })
export class Treatment {
  @Prop({ required: true, unique: true })
  mrn: string; // Treatment Identifier, e.g. TRT-00001

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  })
  patient: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  })
  doctor: Types.ObjectId | null;

  @Prop({ default: 'Self' })
  doctorName: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consulting',
    required: false,
    default: null,
  })
  consulting: Types.ObjectId | null;

  @Prop({
    required: true,
    enum: Object.values(TreatmentType),
    default: TreatmentType.Therapy,
  })
  type: TreatmentType;

  @Prop({ default: 'Therapy' })
  category: string;

  @Prop({ type: [TreatmentItemSchema], default: [] })
  items: TreatmentItem[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: false,
    default: null,
  })
  therapist: Types.ObjectId | null;

  @Prop({ required: true, default: '-' })
  therapistName: string;

  @Prop({
    required: true,
    enum: Object.values(TreatmentStatus),
    default: TreatmentStatus.Pending,
  })
  status: TreatmentStatus;

  @Prop({
    required: true,
    enum: Object.values(TreatmentBillingStatus),
    default: TreatmentBillingStatus.Unbilled,
  })
  billingStatus: TreatmentBillingStatus;

  @Prop({ type: Date, default: Date.now })
  prescriptionDate: Date;

  @Prop({ type: Date, default: Date.now })
  treatmentDate: Date;

  @Prop({ type: String, default: '' })
  notes: string;

  @Prop({ type: Number, default: 1 })
  sessionNumber: number;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Treatment',
    required: false,
    default: null,
  })
  parentTreatment: Types.ObjectId | null;

  @Prop({ type: Boolean, default: false })
  isRepeated: boolean;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Billing',
    required: false,
    default: null,
  })
  bill: Types.ObjectId | null;

  @Prop({ type: String, default: '-' })
  billNo: string;

  @Prop({ type: Number, default: 0 })
  paidAmount: number;

  @Prop({ type: String, default: 'Cash' })
  paymentMethod: string;

  @Prop({ type: Number, default: 0 })
  discount: number;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  })
  processedBy: Types.ObjectId | null;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;
}

export const TreatmentSchema = SchemaFactory.createForClass(Treatment);

// Production Indexes for fast queries, filtering and timeline aggregation
TreatmentSchema.index({ patient: 1, isDeleted: 1 });
TreatmentSchema.index({ parentTreatment: 1, isDeleted: 1 });
TreatmentSchema.index({ status: 1, isDeleted: 1 });
TreatmentSchema.index({ treatmentDate: -1, isDeleted: 1 });
TreatmentSchema.index({ createdAt: -1 });
