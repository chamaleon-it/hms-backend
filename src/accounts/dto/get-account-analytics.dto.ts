import { Transform, Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  SourceModule,
  TransactionType,
} from '../enums/account-transaction.enum';

export class GetAccountAnalyticsDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(SourceModule)
  sourceModule?: SourceModule;

  @IsOptional()
  @IsString()
  period?: 'daily' | 'monthly' | 'yearly' = 'monthly';

  @IsOptional()
  @Type(() => Number)
  year?: number;
}
