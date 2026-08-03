import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: string }) =>
  typeof value === 'string' ? value.trim() : value;

const roundNumber = ({ value }: { value: any }) => {
  if (value === undefined || value === null || value === '') return value;
  const num = Number(value);
  return isNaN(num) ? value : Math.round(num * 100) / 100;
};

export class UpdateBatchDto {
  @IsOptional()
  @IsString({ message: 'Batch number must be a string.' })
  @Transform(trim)
  batchNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Pack size must be an integer.' })
  @Min(1, { message: 'Pack size must be at least 1.' })
  pack?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'No of packs must be an integer.' })
  @Min(0, { message: 'No of packs cannot be negative.' })
  noOfPack?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Quantity must be an integer.' })
  @Min(0, { message: 'Quantity cannot be negative.' })
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @Transform(roundNumber)
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    { message: 'MRP must be a number.' },
  )
  @Min(0, { message: 'MRP cannot be negative.' })
  mrp?: number;

  @IsOptional()
  @Type(() => Number)
  @Transform(roundNumber)
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    { message: 'Unit price must be a number.' },
  )
  @Min(0, { message: 'Unit price cannot be negative.' })
  unitPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @Transform(roundNumber)
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    { message: 'Purchase price must be a number.' },
  )
  @Min(0, { message: 'Purchase price cannot be negative.' })
  purchasePrice?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Expiry date must be a valid date string.' })
  expiryDate?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Free quantity must be an integer.' })
  @Min(0, { message: 'Free quantity cannot be negative.' })
  free?: number;

  @IsOptional()
  @Type(() => Number)
  @Transform(roundNumber)
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    { message: 'Schema amount must be a number.' },
  )
  @Min(0, { message: 'Schema amount cannot be negative.' })
  schemaAmt?: number;

  @IsOptional()
  @Type(() => Number)
  @Transform(roundNumber)
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    { message: 'Total must be a number.' },
  )
  @Min(0, { message: 'Total cannot be negative.' })
  total?: number;

  @IsOptional()
  @IsString({ message: 'Supplier must be a string.' })
  @Transform(trim)
  supplier?: string;
}
