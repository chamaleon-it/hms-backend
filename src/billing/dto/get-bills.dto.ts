import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GetBillisDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(['Cash', 'Online', 'Insurance'])
  method?: 'Cash' | 'Online' | 'Insurance';

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(['Paid', 'Partial', 'Unpaid'])
  status?: 'Paid' | 'Partial' | 'Unpaid';

  @IsOptional()
  @IsString()
  date?: string;
}
