import mongoose from 'mongoose';
import { ReturnReason } from '../schemas/return.schema';

export class CreateReturnDto {
  patient: mongoose.Types.ObjectId;

  order: mongoose.Types.ObjectId;

  items: {
    name: mongoose.Types.ObjectId;
    quantity: number;
    reason: ReturnReason;
    unitPrice: number;
  }[];

  billNo?: string;
}
