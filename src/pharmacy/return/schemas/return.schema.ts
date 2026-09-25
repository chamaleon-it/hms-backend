import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ReturnDocument = HydratedDocument<Return>;

export enum ReturnReason {
  DoctorChangedRx = 'Doctor Changed Rx',
  Expired = 'Expired',
  NearExpiry = 'Near Expiry',
  QualityIssue = 'Quality Issue',
  WrongItem = 'Wrong Item',
  AdverseReaction = 'Adverse Reaction',
  NotRequired = 'Not Required',
  Damaged = 'Damaged',
  Other = 'Other',
}

@Schema({ versionKey: false, timestamps: true })
export class Return {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
  })
  patient: mongoose.Types.ObjectId;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Order' })
  order: mongoose.Types.ObjectId;

  @Prop({
    default: () => [],
    type: [
      {
        name: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item',
          required: true,
        },
        quantity: { type: Number, default: 0, min: 0 },
        reason: {
          type: String,
          enum: Object.values(ReturnReason),
          default: ReturnReason.DoctorChangedRx,
        },
        unitPrice: { type: Number, default: 0 },
      },
    ],
  })
  items: {
    name: mongoose.Types.ObjectId;
    quantity: number;
    reason: ReturnReason;
  }[];

  @Prop({ default: '-' })
  billNo: string;
}

export const ReturnSchema = SchemaFactory.createForClass(Return);
