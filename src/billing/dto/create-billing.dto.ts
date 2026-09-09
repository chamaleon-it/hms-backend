import { Type, Transform } from 'class-transformer';
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

  @IsString()
  @IsOptional()
  batchNumber?: string;

  @IsOptional()
  expiryDate?: Date;
}

export class BillingCustomerDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  age?: number;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

export class CreateBillingDto {
  @IsMongoId()
  @IsOptional()
  user!: mongoose.Types.ObjectId;

  @Transform(({ value }) => (!value || value === '' ? undefined : value))
  @IsMongoId()
  @IsOptional()
  patient?: mongoose.Types.ObjectId;

  @IsOptional()
  @ValidateNested()
  @Type(() => BillingCustomerDto)
  customer?: BillingCustomerDto;

  @IsOptional()
  isWalkIn?: boolean;

  @IsString()
  @IsOptional()
  doctor: string;

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

  @IsString()
  @IsOptional()
  rxId?: string;
}
