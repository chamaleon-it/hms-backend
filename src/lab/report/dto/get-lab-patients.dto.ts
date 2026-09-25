import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class GetLabPatientsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  q?: string; // name / phone / mrn / address

  @IsOptional()
  gender?: string;

  @IsOptional()
  doctor?: string;

  @IsOptional()
  lastVisit?: string; // 7 / 30 / Custom

  @IsOptional()
  from?: string;

  @IsOptional()
  to?: string;

  @IsOptional()
  age?: string; // `${min}-${max}`
}
