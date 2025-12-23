import mongoose from 'mongoose';
import { RefundMode, ReturnedBy, ReturnReason } from '../schemas/return.schema';

export class CreateReturnDto {
  patient: mongoose.Types.ObjectId;

  order: mongoose.Types.ObjectId;

  items: {
    name: mongoose.Types.ObjectId;
    quantity: number;
    reason: ReturnReason;
    unitPrice: number;
  }[];

  refundMode: RefundMode;

  returnedBy: ReturnedBy;

  remarks?: string;
}
