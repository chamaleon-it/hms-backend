import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';
import { CreateBillingItemDto } from './create-billing.dto';

/**
 * Explicit PATCH whitelist — forbids reassigning user/patient/mrn/reportId/rxId/status
 * via PartialType(CreateBillingDto) mass-assignment.
 */
export class UpdateBillingDto {
  @IsString()
  @IsOptional()
  doctor?: string;

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
  discount?: number;

  @IsString()
  @IsOptional()
  note?: string;

  /** Optional catalogue item ref when editing line linkage — not ownership fields. */
  @IsMongoId()
  @IsOptional()
  itemId?: mongoose.Types.ObjectId;
}
