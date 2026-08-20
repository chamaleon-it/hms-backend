import {
  IsString,
  IsOptional,
  IsArray,
  IsNotEmpty,
  IsDateString,
  IsMongoId,
  IsNumber,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import mongoose from 'mongoose';
import { TreatmentType, TreatmentStatus } from '../schemas/treatment.schema';

export class TreatmentItemDto {
  @IsString({ message: 'Item name is required.' })
  @IsNotEmpty({ message: 'Item name cannot be empty.' })
  name: string;

  @IsOptional()
  @IsMongoId()
  therapyId?: mongoose.Types.ObjectId;

  @IsOptional()
  @IsString()
  subTherapyId?: string;

  @IsOptional()
  @IsMongoId()
  procedureId?: mongoose.Types.ObjectId;

  @IsOptional()
  @IsString()
  subProcedureId?: string;

  @IsOptional()
  @IsString()
  parentName?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  gst?: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsNumber()
  @IsNotEmpty()
  total: number;
}

export class CreateTreatmentDto {
  @IsMongoId({ message: 'Patient must be a valid ID.' })
  @IsNotEmpty({ message: 'Patient is required.' })
  patient: mongoose.Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  doctor?: mongoose.Types.ObjectId;

  @IsOptional()
  @IsString()
  doctorName?: string;

  @IsOptional()
  @IsMongoId()
  consulting?: mongoose.Types.ObjectId;

  @IsOptional()
  @IsEnum(TreatmentType)
  type?: TreatmentType;

  @IsOptional()
  @IsString()
  category?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TreatmentItemDto)
  items: TreatmentItemDto[];

  @IsOptional()
  @IsMongoId()
  therapist?: mongoose.Types.ObjectId;

  @IsString({ message: 'Therapist name is required.' })
  @IsNotEmpty({ message: 'Therapist name cannot be empty.' })
  therapistName: string;

  @IsOptional()
  @IsEnum(TreatmentStatus)
  status?: TreatmentStatus;

  @IsOptional()
  @IsDateString()
  prescriptionDate?: Date;

  @IsOptional()
  @IsDateString()
  treatmentDate?: Date;

  @IsOptional()
  @IsArray()
  treatmentDates?: (Date | string)[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  discount?: number;
}
