import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
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

  @IsString()
  @IsOptional()
  batchNumber?: string;

  @IsOptional()
  expiryDate?: string | Date;

  @IsString()
  @IsOptional()
  generic?: string;
}

export class CreateBillingDto {
  @IsMongoId()
  @IsOptional()
  user!: mongoose.Types.ObjectId;

  @IsMongoId()
  @IsNotEmpty()
  patient: mongoose.Types.ObjectId;

  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '' || value === 'Self' || value === 'self' || value === '-') {
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed === 'Self' || trimmed === 'self' || trimmed === '-') {
        return null;
      }

      return mongoose.isValidObjectId(trimmed)
        ? new mongoose.Types.ObjectId(trimmed)
        : null;
    }

    return mongoose.isValidObjectId(value)
      ? new mongoose.Types.ObjectId(value.toString())
      : null;
  })
  @IsOptional()
  @IsMongoId()
  doctor?: mongoose.Types.ObjectId | null;

  @IsString()
  @IsOptional()
  inCharge?: string;

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
  card?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  upi?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  mrn?: string;

  @IsString()
  @IsOptional()
  rxId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  transactionType?: 'Sale' | 'Return' | 'Refund';

  @IsMongoId()
  @IsOptional()
  reportId?: mongoose.Types.ObjectId;

  @IsString()
  @IsOptional()
  token?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  tokenNumber?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  roundOff?: boolean;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  payer?: string;

  @IsOptional()
  @IsString()
  policyNo?: string;

  @IsOptional()
  @IsString()
  tpa?: string;

  @IsOptional()
  @IsString()
  preAuthNo?: string;
}
