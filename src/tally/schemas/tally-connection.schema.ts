import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TallyConnectionDocument = HydratedDocument<TallyConnection>;

@Schema({ timestamps: true, versionKey: false, collection: 'tally_connections' })
export class TallyConnection {
  /** Singleton key — one active pharmacy Tally connection per deployment */
  @Prop({ required: true, unique: true, default: 'pharmacy' })
  key: string;

  @Prop({ required: true, default: 'localhost' })
  host: string;

  @Prop({ required: true, default: 9000 })
  port: number;

  @Prop({ required: false, default: '' })
  companyName?: string;

  @Prop({ required: false, default: 'Cash' })
  cashLedger?: string;

  @Prop({ required: false, default: 'UPI' })
  upiLedger?: string;

  @Prop({ required: false, default: 'Card' })
  cardLedger?: string;

  @Prop({ required: false, default: 'Pharmacy Sales' })
  salesLedger?: string;

  @Prop({ required: false, default: 'Indirect Expenses' })
  expenseLedger?: string;

  @Prop({ required: true, default: false })
  connected: boolean;

  @Prop({ required: false })
  lastCheckedAt?: Date;

  @Prop({ required: false })
  lastError?: string;

  @Prop({ required: false })
  connectedAt?: Date;

  @Prop({ required: false })
  connectedBy?: string;
}

export const TallyConnectionSchema =
  SchemaFactory.createForClass(TallyConnection);
