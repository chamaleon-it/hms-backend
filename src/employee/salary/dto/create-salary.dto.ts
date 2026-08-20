import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSalaryDto {
  @IsMongoId({ message: 'Employee ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Employee ID is required' })
  employee: string;

  @IsString({ message: 'Month is required' })
  @IsNotEmpty({ message: 'Month is required' })
  month: string;

  @IsNumber({}, { message: 'Year must be a number' })
  @IsNotEmpty({ message: 'Year is required' })
  year: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basicPay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlySalary?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hoursWorked?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commission?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  allowances?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonus?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deductions?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unpaidLeaves?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unpaidLeaveDeduction?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class GenerateBatchPayrollDto {
  @IsString({ message: 'Month is required' })
  @IsNotEmpty({ message: 'Month is required' })
  month: string;

  @IsNumber({}, { message: 'Year must be a number' })
  @IsNotEmpty({ message: 'Year is required' })
  year: number;

  @IsOptional()
  @IsString()
  role?: string;
}
