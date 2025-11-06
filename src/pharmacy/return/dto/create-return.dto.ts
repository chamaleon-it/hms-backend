import mongoose from 'mongoose';

export class CreateReturnDto {
  patient: mongoose.Types.ObjectId;

  order: mongoose.Types.ObjectId;

  items: {
    name: mongoose.Types.ObjectId;
    quantity: number;
    reason: string;
  }[];

  refundMode: string;

  returnedBy: string;

  remarks: string;
}
