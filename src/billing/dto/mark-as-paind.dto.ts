import { IsOptional, IsNumber, Min, IsBoolean } from 'class-validator';

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

  /**
   * When true, the amounts are the final split for the bill and replace what
   * is stored. When false (default), they are added to the existing amounts.
   */
  @IsOptional()
  @IsBoolean()
  replace?: boolean;
}
