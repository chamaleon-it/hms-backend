import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: string }) =>
  typeof value === 'string' ? value.trim() : value;

export class AddBatchDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  @Transform(trim)
  @IsNotEmpty()
  batchNumber!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsDateString()
  expiryDate!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchasePrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(trim)
  supplier?: string;

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

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  gst?: number;
}
