import mongoose from 'mongoose';
import { PaymentStatus } from '../schemas/order.schema';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdatePaymentDto {
  @IsMongoId()
  @IsNotEmpty()
  orderId: mongoose.Types.ObjectId;

  @IsEnum(PaymentStatus)
  @IsNotEmpty()
  paymentStatus: PaymentStatus;

  @IsNumber()
  @IsNotEmpty()
  paidAmount: number;

  @IsString()
  @IsOptional()
  paymentReference?: string;
}
