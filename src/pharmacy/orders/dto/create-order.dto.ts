import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ArrayMinSize,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { OrderPriority, OrderStatus } from '../schemas/order.schema';
import mongoose from 'mongoose';

export class OrderItemDto {
  @IsMongoId({ message: 'Item name must be a valid MongoDB ObjectId' })
  name!: mongoose.Types.ObjectId;

  @IsString({ message: 'Dosage must be a string' })
  @IsOptional()
  dosage!: string;

  @IsString({ message: 'Frequency must be a string' })
  @IsOptional()
  frequency!: string;

  @IsString({ message: 'Food instruction must be a string' })
  @IsOptional()
  food!: string;

  @IsString({ message: 'Duration must be a string' })
  @IsOptional()
  duration!: string;

  @IsNumber()
  @IsNotEmpty({ message: 'Duration cannot be empty.' })
  quantity: number;
}

export class CreateOrderDto {
  @IsString({ message: 'MRN must be a string' })
  @IsOptional()
  mrn?: string;

  @IsMongoId({ message: 'Patient ID must be a valid MongoDB ObjectId' })
  patient: mongoose.Types.ObjectId;

  @IsMongoId({ message: 'Doctor ID must be a valid MongoDB ObjectId' })
  doctor: mongoose.Types.ObjectId;

  @IsArray({ message: 'Items must be an array' })
  @ArrayMinSize(1, { message: 'At least one item is required' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsEnum(OrderPriority, {
    message: `Priority must be one of: ${Object.values(OrderPriority).join(', ')}`,
  })
  priority: OrderPriority = OrderPriority.Normal;

  @IsEnum(OrderStatus, {
    message: `Status must be one of: ${Object.values(OrderStatus).join(', ')}`,
  })
  status: OrderStatus = OrderStatus.Pending;

  @IsOptional()
  @IsMongoId({ message: 'AssignedTo must be a valid MongoDB ObjectId' })
  assignedTo?: string;
}
