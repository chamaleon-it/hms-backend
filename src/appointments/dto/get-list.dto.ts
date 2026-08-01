import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class GetListDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }): string[] => {
    if (!value) return [];
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return [];
    }
  })
  status?: string[];

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  doctor?: string;

  activeDate: 'Today' | '7 days' | '30 days' | 'Custom';
}
