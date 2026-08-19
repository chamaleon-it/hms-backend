import { IsOptional, IsNumber, Min } from 'class-validator';

export class MarkAsPaidDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  cash?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  upi?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  card?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;
}
