import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsMongoId,
  Min,
} from 'class-validator';
import mongoose from 'mongoose';

export class ProcessTreatmentDto {
  /** Session charge entered at completion. Not the catalog price. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsNumber()
  cash?: number;

  @IsOptional()
  @IsNumber()
  card?: number;

  @IsOptional()
  @IsNumber()
  upi?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: Date;

  @IsOptional()
  @IsMongoId()
  therapist?: mongoose.Types.ObjectId;

  @IsOptional()
  @IsString()
  therapistName?: string;
}
