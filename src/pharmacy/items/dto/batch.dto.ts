import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { BatchStatus } from '../schemas/item.schema';

const trim = ({ value }: { value: string }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateBatchDto {
  @IsString()
  @MinLength(1)
  @Transform(trim)
  @IsNotEmpty()
  batchNumber!: string;

  @IsDateString({}, { message: 'Expiry date must be an ISO date.' })
  expiryDate!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  mrp?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  purchaseRate?: number;

  /** Legacy alias — mapped to purchaseRate when purchaseRate omitted. */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  purchasePrice?: number;

  /** Canonical sale / unit rate. */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  /**
   * Legacy alias — mapped to unitPrice when unitPrice omitted.
   * Prefer unitPrice; kept for older clients / Atlas dual-read migration.
   */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  saleRate?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  startingQuantity?: number;

  @IsOptional()
  @IsString()
  @Transform(trim)
  supplier?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  packing?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  stripCount?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  gst?: number;

  @IsOptional()
  @IsEnum(BatchStatus)
  status?: BatchStatus;
}

export class UpdateBatchDto {
  @IsOptional()
  @IsDateString({}, { message: 'Expiry date must be an ISO date.' })
  expiryDate?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  mrp?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  purchaseRate?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  purchasePrice?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  unitPrice?: number;

  /** Legacy alias — mapped to unitPrice. */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  saleRate?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  startingQuantity?: number;

  @IsOptional()
  @IsString()
  @Transform(trim)
  supplier?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  packing?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  stripCount?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  gst?: number;

  @IsOptional()
  @IsEnum(BatchStatus)
  status?: BatchStatus;
}

export class PatchBatchStatusDto {
  @IsEnum(BatchStatus, {
    message: `Status must be one of: ${Object.values(BatchStatus).join(', ')}.`,
  })
  status!: BatchStatus;
}
