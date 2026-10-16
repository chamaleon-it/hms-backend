import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import mongoose from 'mongoose';
import { OrderPriority } from '../schemas/order.schema';

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

  @IsInt()
  @Min(1)
  @IsNotEmpty({ message: 'Quantity cannot be empty.' })
  quantity?: number;

  /** Selected inventory batch subdocument id */
  @IsOptional()
  @IsString()
  batchId?: string | null;

  @IsOptional()
  @IsString()
  batchNumber?: string | null;

  @IsOptional()
  batchExpiryDate?: Date | string | null;

  @IsOptional()
  @IsNumber()
  batchMrp?: number | null;

  @IsOptional()
  @IsNumber()
  batchPurchasePrice?: number | null;

  @IsOptional()
  @IsNumber()
  batchSellingPrice?: number | null;

  @IsOptional()
  @IsNumber()
  batchGst?: number | null;

  @IsOptional()
  @IsNumber()
  batchStock?: number | null;

  @IsOptional()
  @IsString()
  batchSupplier?: string | null;

  @IsOptional()
  @IsNumber()
  batchPacking?: number | null;
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
  patient?: string;

  @IsMongoId()
  @IsOptional()
  doctor?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  @IsOptional()
  items?: UpdateOrderItemDto[];

  @IsEnum(OrderPriority)
  @IsOptional()
  priority?: string;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsString()
  @IsOptional()
  doctorName?: string;

  @IsString()
  @IsOptional()
  pharmacist?: string;

  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  assignedTo?: string;
}
