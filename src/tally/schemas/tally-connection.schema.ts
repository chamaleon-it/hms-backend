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

  /** Pharmacy ledger — Receipt side (medicine sales). */
  @Prop({ required: false, default: 'Pharmacy Sales' })
  salesLedger?: string;

  /** Generic fallback Payment ledger for anything outside the four ledgers below. */
  @Prop({ required: false, default: 'Indirect Expenses' })
  expenseLedger?: string;

  /** Pharmacy ledger — Payment side (medicine returns / refunds). */
  @Prop({ required: false, default: 'Pharmacy Returns' })
  pharmacyPaymentLedger?: string;

  /** Therapy ledger — Receipt side (procedure + therapy fees). */
  @Prop({ required: false, default: 'Therapy Income' })
  therapyReceiptLedger?: string;

  /** Therapy ledger — Payment side (procedure + therapy refunds). */
  @Prop({ required: false, default: 'Therapy Refunds' })
  therapyPaymentLedger?: string;

  /** Reception ledger — Receipt side (appointment / consultation fees). */
  @Prop({ required: false, default: 'Reception Income' })
  receptionReceiptLedger?: string;

  /** Reception ledger — Payment side (NCF + appointment refunds). */
  @Prop({ required: false, default: 'Reception Refunds' })
  receptionPaymentLedger?: string;

  /** Purchase ledger — Payment side only (Cash/Card/UPI actually paid to suppliers). */
  @Prop({ required: false, default: 'Purchase Payments' })
  purchasePaymentLedger?: string;

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
