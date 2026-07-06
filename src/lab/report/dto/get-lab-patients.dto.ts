import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

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
  limit?: number = 10;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(['true', 'false'])
  alreadyTested?: 'true' | 'false' = 'true';

  @IsOptional()
  q?: string; // phone number / patiner name / address / patient id

  @IsOptional()
  gender?: string; // Female, Male

  @IsOptional()
  doctor?: string; // mongose id

  @IsOptional()
  lastVisit?: string; //  7 / 30 / Custom

  @IsOptional()
  from?: string; // date if custom

  @IsOptional()
  to?: string; // date if custom

  @IsOptional()
  age: string; // `${filter.age[0]}-${filter.age[1]}`
}
