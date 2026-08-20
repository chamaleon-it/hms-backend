import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsMongoId,
} from 'class-validator';
import mongoose from 'mongoose';

export class ProcessTreatmentDto {
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
  @IsString()
  notes?: string;

  @IsOptional()
  @IsMongoId()
  therapist?: mongoose.Types.ObjectId;

  @IsOptional()
  @IsString()
  therapistName?: string;
}
