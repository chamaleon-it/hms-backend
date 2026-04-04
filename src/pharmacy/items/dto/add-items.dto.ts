import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ItemStatus } from '../schemas/item.schema';

const trim = ({ value }: { value: string }) =>
  typeof value === 'string' ? value.trim() : value;

export class AddItemDto {
  @IsString({ message: 'Name must be a string.' })
  @MinLength(2, { message: 'Name must be at least 2 characters.' })
  @MaxLength(120, { message: 'Name must be at most 120 characters.' })
  @Transform(trim)
  @IsNotEmpty({ message: 'Name is required.' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'Generic must be a string.' })
  @MaxLength(120, { message: 'Generic must be at most 120 characters.' })
  @Transform(trim)
  generic?: string;

  // India GST HSN code is typically 4–8 digits
  @IsOptional()
  // @Matches(/^\d{4,8}$/, { message: 'HSN code must be 4–8 digits.' })
  @Transform(trim)
  hsnCode?: string;

  @IsOptional()
  @IsString({ message: 'SKU must be a string.' })
  @MaxLength(64, { message: 'SKU must be at most 64 characters.' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  sku?: string;

  @IsString({ message: 'Category must be a string.' })
  @Transform(trim)
  @IsNotEmpty({ message: 'Category is required.' })
  category!: string;

  @IsOptional()
  @IsString({ message: 'Supplier must be a string.' })
  @Transform(trim)
  supplier?: string;

  @IsOptional()
  @IsString({ message: 'Supplier must be a string.' })
  @Transform(trim)
  manufacturer?: string;

  @Type(() => Number)
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    { message: 'Unit price must be a number (max 2 decimals).' },
  )
  @Min(0, { message: 'Unit price cannot be negative.' })
  unitPrice!: number;

  @Type(() => Number)
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    { message: 'MRP must be a number (max 2 decimals).' },
  )
  @Min(0, { message: 'MRP cannot be negative.' })
  mrp!: number;

  @Type(() => Number)
  @IsNumber(
    { allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 },
    { message: 'Unit price must be a number (max 2 decimals).' },
  )
  @Min(0, { message: 'Purchase price cannot be negative.' })
  purchasePrice!: number;

  @Type(() => Number)
  @IsInt({ message: 'Opening stock must be an integer.' })
  @Min(0, { message: 'Opening stock cannot be negative.' })
  @IsOptional()
  openingStockQuantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Quantity must be an integer.' })
  @Min(0, { message: 'Quantity cannot be negative.' })
  @IsOptional()
  quantity?: number;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Expiry date must be an ISO date (YYYY-MM-DD or full ISO).' },
  )
  expiryDate?: string;

  @IsOptional()
  @IsString({ message: 'Batch number must be a string.' })
  @Transform(trim)
  batchNumber?: string;

  @IsOptional()
  @IsString({ message: 'Rack location must be a string.' })
  @Transform(trim)
  rackLocation?: string;

  @IsOptional()
  packing?: number;

  @IsOptional()
  gst?: number;

  @IsOptional()
  @IsEnum(ItemStatus, {
    message: `Status must be one of: ${Object.values(ItemStatus).join(', ')}.`,
  })
  @Transform(({ value }) => (value ? String(value).trim() : ItemStatus.Active))
  status?: ItemStatus = ItemStatus.Active;
}
