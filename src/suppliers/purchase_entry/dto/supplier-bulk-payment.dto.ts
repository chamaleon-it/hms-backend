import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class SupplierBulkPaymentDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01, { message: 'Payment amount must be greater than 0' })
  amount: number;

  @IsOptional()
  @IsString()
  paymentRef?: string;
}
