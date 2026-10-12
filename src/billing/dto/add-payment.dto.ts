import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class AddPaymentDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  cash: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  online: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  card?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  discount?: number;
}
