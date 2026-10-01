import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
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
  @IsEnum(['Cash', 'Card', 'UPI'])
  method?: 'Cash' | 'Card' | 'UPI';

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
  @IsDate()
  @Type(() => Date)
  date?: Date;

  @IsOptional()
  @IsString()
  activeDate?: string;

  @IsOptional()
  @IsString()
  userRole?: string;

  @IsOptional()
  @IsString()
  billType?: string;

  /** Filter by first-time vs repeat patient (first Sale bill = new). */
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(['new', 'existing', 'all'])
  patientVisitor?: 'new' | 'existing' | 'all';

  /** List order. Pharmacy billing asks for oldest invoice first. */
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc';
}
