import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class GetBillisDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  qEnd?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(['Cash', 'Online'])
  method?: 'Cash' | 'Online';

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(['Paid', 'Partial', 'Unpaid'])
  status?: 'Paid' | 'Partial' | 'Unpaid';

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsString()
  activeDate?: string;

  /**
   * Soft billing categories (heuristic). Include-if-any line matches.
   * Values: Consultation | Clinical | Pharmacy | Lab | Dressing | Sale | Return
   */
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === 'all' ? undefined : value))
  @IsEnum([
    'Consultation',
    'Clinical',
    'Pharmacy',
    'Lab',
    'Dressing',
    'Sale',
    'Return',
  ])
  billingType?:
    | 'Consultation'
    | 'Clinical'
    | 'Pharmacy'
    | 'Lab'
    | 'Dressing'
    | 'Sale'
    | 'Return';

  @IsOptional()
  @Transform(({ value }) => value == null ? undefined : Array.isArray(value) ? value : [value])
  @IsArray()
  @IsString({ each: true })
  doctor?: string[];
}
