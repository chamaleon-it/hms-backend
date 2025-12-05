import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import mongoose from 'mongoose';

export class UpdateOrderItemNameDto {
  @IsMongoId()
  @IsOptional()
  _id?: mongoose.Types.ObjectId;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsOptional()
  generic?: string;

  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @IsNumber()
  @IsOptional()
  purchasePrice?: number;

  @IsOptional()
  expiryDate?: Date;
}

export class UpdateOrderItemDto {
  @ValidateNested()
  @Type(() => UpdateOrderItemNameDto)
  @IsOptional()
  name?: UpdateOrderItemNameDto;

  @IsString()
  @IsOptional()
  dosage?: string;

  @IsString()
  @IsOptional()
  frequency?: string;

  @IsString()
  @IsOptional()
  food?: string;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsNumber()
  @IsNotEmpty({ message: 'Quantity cannot be empty.' })
  quantity?: number;

  @IsBoolean()
  @IsOptional()
  isPacked?: boolean;
}

export class UpdateOrderDto {
  @IsMongoId()
  @IsNotEmpty({ message: 'Order ID cannot be empty.' })
  _id?: mongoose.Types.ObjectId;

  @IsString()
  @IsOptional()
  mrn?: string;

  @IsString()
  @IsOptional()
  patient?: string; // patient _id

  @IsMongoId()
  @IsOptional()
  doctor?: string; // doctor _id

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  @IsOptional()
  items?: UpdateOrderItemDto[];

  @IsEnum(['Normal', 'High', 'Critical'])
  @IsOptional()
  priority?: string;

  @IsEnum(['Pending', 'Packed', 'Completed', 'Cancelled'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  assignedTo?: string; // staff id
}
