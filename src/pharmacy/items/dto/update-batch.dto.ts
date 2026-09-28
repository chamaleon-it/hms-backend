import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const trim = ({ value }: { value: string }) =>
  typeof value === 'string' ? value.trim() : value;

/** Treat empty string as absent so optional date/number fields from HTML inputs pass. */
const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value;

export class UpdateBatchDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Transform(trim)
  batchNumber?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @ValidateIf((_, v) => v !== undefined)
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  packing?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stripCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  mrp?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  /** Legacy import alias for unitPrice (saleRate). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  saleRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  /** Import / older FE alias — dual-written with purchasePrice. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchaseRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  gst?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trim)
  supplier?: string;
}
