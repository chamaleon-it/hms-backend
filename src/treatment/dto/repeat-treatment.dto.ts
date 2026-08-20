import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsMongoId,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import mongoose from 'mongoose';
import { TreatmentItemDto } from './create-treatment.dto';

export class RepeatTreatmentDto {
  @IsOptional()
  @IsMongoId()
  therapist?: mongoose.Types.ObjectId;

  @IsOptional()
  @IsString()
  therapistName?: string;

  @IsOptional()
  @IsDateString()
  treatmentDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatmentItemDto)
  items?: TreatmentItemDto[];

  @IsOptional()
  @IsBoolean()
  autoProcess?: boolean;

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
}
