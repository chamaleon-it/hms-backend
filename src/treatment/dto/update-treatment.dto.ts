import {
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
  IsMongoId,
  IsNumber,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import mongoose from 'mongoose';
import { TreatmentType, TreatmentStatus } from '../schemas/treatment.schema';
import { TreatmentItemDto } from './create-treatment.dto';

export class UpdateTreatmentDto {
  @IsOptional()
  @IsEnum(TreatmentType)
  type?: TreatmentType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatmentItemDto)
  items?: TreatmentItemDto[];

  @IsOptional()
  @IsMongoId()
  therapist?: mongoose.Types.ObjectId;

  @IsOptional()
  @IsString()
  therapistName?: string;

  @IsOptional()
  @IsEnum(TreatmentStatus)
  status?: TreatmentStatus;

  @IsOptional()
  @IsDateString()
  treatmentDate?: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  discount?: number;
}
