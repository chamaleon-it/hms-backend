import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNumber,
  IsMongoId,
  IsNotEmpty,
  IsBoolean,
  Allow,
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

  /** Populated item extras the FE may re-send; allowed then ignored. */
  @IsOptional()
  @Allow()
  quantity?: number;

  @IsOptional()
  @Allow()
  openingStockQuantity?: number;

  @IsOptional()
  @Allow()
  pharmacy?: string;

  @IsOptional()
  @Allow()
  category?: string;

  @IsOptional()
  @Allow()
  supplier?: string;

  @IsOptional()
  @Allow()
  manufacturer?: string;

  @IsOptional()
  @Allow()
  status?: string;

  @IsOptional()
  @Allow()
  hsnCode?: string;

  @IsOptional()
  @Allow()
  rackLocation?: string;

  @IsOptional()
  @Allow()
  mrp?: number;

  @IsOptional()
  @Allow()
  gst?: number;

  @IsOptional()
  @Allow()
  packing?: number;

  @IsOptional()
  @Allow()
  createdAt?: Date | string;

  @IsOptional()
  @Allow()
  updatedAt?: Date | string;

  @IsOptional()
  @Allow()
  batches?: unknown;
}

export class UpdateOrderItemDto {
  @ValidateNested()
  @Type(() => UpdateOrderItemNameDto)
  @IsOptional()
  name?: UpdateOrderItemNameDto | mongoose.Types.ObjectId | string;

  @IsOptional()
  @IsBoolean()
  isCustom?: boolean;

  @IsOptional()
  @IsString()
  referralName?: string;

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

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  mrp?: number;

  @IsOptional()
  @IsNumber()
  gst?: number;

  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @IsOptional()
  @Allow()
  availableQuantity?: number;

  @IsOptional()
  @Allow()
  medicineName?: string;

  @IsOptional()
  @Allow()
  rowId?: string;

  @IsOptional()
  @Allow()
  packing?: number;

  @IsOptional()
  @Allow()
  stripCount?: number;

  @IsOptional()
  @Allow()
  expiryDate?: string | Date;

  @IsOptional()
  @Allow()
  supplier?: string;

  @IsOptional()
  @Allow()
  _id?: string;
}

export class UpdateOrderDto {
  @IsMongoId()
  @IsNotEmpty({ message: 'Order ID cannot be empty.' })
  _id?: mongoose.Types.ObjectId;

  @IsString()
  @IsOptional()
  mrn?: string;

  @IsOptional()
  patient?: string | mongoose.Types.ObjectId;

  @IsOptional()
  doctor?: string | mongoose.Types.ObjectId;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  @IsOptional()
  items?: UpdateOrderItemDto[];

  @IsEnum(['Normal', 'High', 'Critical'])
  @IsOptional()
  priority?: string;

  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  paidAmount?: number;

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
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  billNo?: string;

  @IsOptional()
  @IsString()
  pharmacist?: string;

  @IsOptional()
  @IsString()
  doctorName?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  advice?: string;

  /** FE may re-spread timestamps / flags from OrderType; allow then ignore. */
  @IsOptional()
  @Allow()
  isDeleted?: boolean;

  @IsOptional()
  @Allow()
  createdAt?: Date | string;

  @IsOptional()
  @Allow()
  updatedAt?: Date | string;

  @IsOptional()
  @Allow()
  __v?: number;
}
