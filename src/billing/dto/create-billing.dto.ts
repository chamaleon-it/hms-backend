import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';

export class CreateBillingItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  gst?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  total?: number;
}

export class CreateBillingDto {
  @IsMongoId()
  @IsOptional()
  user!: mongoose.Types.ObjectId;

  @IsMongoId()
  @IsNotEmpty()
  patient: mongoose.Types.ObjectId;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBillingItemDto)
  @IsOptional()
  items?: CreateBillingItemDto[];

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  cash?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  online?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  insurance?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsString()
  @IsOptional()
  payer?: string;

  @IsString()
  @IsOptional()
  policyNo?: string;

  @IsString()
  @IsOptional()
  tpa?: string;

  @IsString()
  @IsOptional()
  preAuthNo?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  mrn?: string;
}
