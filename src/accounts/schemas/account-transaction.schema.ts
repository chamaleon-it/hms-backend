import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { PaymentMethod, SourceModule, TransactionType } from '../enums/account-transaction.enum';

export type AccountTransactionDocument = HydratedDocument<AccountTransaction>;

@Schema({ timestamps: true, versionKey: false })
export class AccountTransaction {
  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true })
  description: string;

  @Prop({ required: false, enum: PaymentMethod, default: PaymentMethod.Cash })
  paymentMethod?: PaymentMethod;

  @Prop({ required: false, enum: SourceModule, default: SourceModule.Uncategorised })
  sourceModule?: SourceModule;

  @Prop({ required: false })
  notes?: string;

  @Prop({ required: true, type: Date })
  transactionDate: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  createdBy: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false })
  updatedBy?: mongoose.Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date, required: false })
  deletedAt?: Date;
}

export const AccountTransactionSchema =
  SchemaFactory.createForClass(AccountTransaction);
