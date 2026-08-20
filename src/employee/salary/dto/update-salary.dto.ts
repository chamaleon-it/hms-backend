import { PartialType } from '@nestjs/mapped-types';
import { CreateSalaryDto } from './create-salary.dto';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { SalaryPaymentStatus } from '../schemas/employee-salary.schema';

export class UpdateSalaryDto extends PartialType(CreateSalaryDto) {
  @IsOptional()
  @IsEnum(SalaryPaymentStatus)
  paymentStatus?: SalaryPaymentStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;
}
