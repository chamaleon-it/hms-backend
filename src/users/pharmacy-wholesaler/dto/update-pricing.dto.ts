import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class UpdatePricingDto {
  @IsNumber()
  @IsNotEmpty()
  defaultMargin: number;

  @IsNumber()
  @IsNotEmpty()
  minOrderValue: number;

  @IsNumber()
  @IsNotEmpty()
  creditPeriod: number;

  @IsBoolean()
  @IsNotEmpty()
  allowCreditOrder: boolean;
}
