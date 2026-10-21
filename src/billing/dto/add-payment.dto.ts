import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

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

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  refund?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  expense?: number;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  remarks?: string;
}
