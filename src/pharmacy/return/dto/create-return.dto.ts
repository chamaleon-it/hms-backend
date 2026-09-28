import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';
import { RefundMode, ReturnedBy, ReturnReason } from '../schemas/return.schema';

export class CreateReturnItemDto {
  @IsMongoId()
  name: mongoose.Types.ObjectId;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsEnum(ReturnReason)
  reason: ReturnReason;

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
  @Type(() => CreateReturnItemDto)
  items: CreateReturnItemDto[];

  @IsEnum(RefundMode)
  refundMode: RefundMode;

  @IsEnum(ReturnedBy)
  returnedBy: ReturnedBy;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  billNo?: string;
}
