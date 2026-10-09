import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class RecordSupplierPaymentDto {
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
