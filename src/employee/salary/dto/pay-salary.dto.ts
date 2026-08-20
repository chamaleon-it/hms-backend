import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { SalaryPaymentMethod } from '../schemas/employee-salary.schema';

export class PaySalaryDto {
  @IsEnum(SalaryPaymentMethod, {
    message: 'Payment method must be Cash, Bank Transfer, UPI, or Cheque',
  })
  @IsNotEmpty({ message: 'Payment method is required' })
  paymentMethod: SalaryPaymentMethod;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  paymentDate?: string | Date;

  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
