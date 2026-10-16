import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsMongoId, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import mongoose from 'mongoose';
import { ReturnReason } from '../schemas/return.schema';

export class ReturnItemDto {
  @IsMongoId()
  name: mongoose.Types.ObjectId;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsEnum(ReturnReason)
  reason?: ReturnReason;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateReturnDto {
  @IsMongoId()
  patient: mongoose.Types.ObjectId;

  @IsMongoId()
  order: mongoose.Types.ObjectId;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];

  @IsOptional()
  @IsString()
  billNo?: string;
}
