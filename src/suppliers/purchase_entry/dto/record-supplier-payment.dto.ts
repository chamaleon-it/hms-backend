import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class RecordSupplierPaymentDto {
  @IsOptional()
  @IsDateString({ strict: true })
  date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cash?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  card?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  upi?: number;
}
