import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ReturnDocument = HydratedDocument<Return>;

export enum RefundMode {
  Cash = 'Cash',
  UPI = 'UPI',
  AdjustNextBill = 'Adjust in Next Bill',
}

export enum ReturnedBy {
  Patient = 'Patient',
  Staff = 'Staff',
}

export enum ReturnReason {
  Expired = 'Expired',
  Damaged = 'Damaged',
  WrongTtem = 'Wrong item',
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

  @Prop({ required: true, enum: Object.values(RefundMode) })
  refundMode: RefundMode;

  @Prop({ required: true, enum: Object.values(ReturnedBy) })
  returnedBy: ReturnedBy;

  @Prop({ default: null })
  remarks: string;

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
          default: ReturnReason.Expired,
        },
      },
    ],
  })
  items: {
    name: mongoose.Types.ObjectId;
    quantity: number;
    reason: ReturnReason;
  }[];
}

export const ReturnSchema = SchemaFactory.createForClass(Return);
