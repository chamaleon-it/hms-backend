import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TransactionType } from '../enums/account-transaction.enum';

export class CreateAccountTransactionDto {
  @IsEnum(TransactionType, {
    message: 'Type must be either Income or Expense',
  })
  @IsNotEmpty()
  type: TransactionType;

  @IsString()
  @IsNotEmpty({ message: 'Category is required' })
  category: string;

  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than zero' })
  amount: number;

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDate({ message: 'Valid transaction date is required' })
  @Type(() => Date)
  transactionDate: Date;
}
