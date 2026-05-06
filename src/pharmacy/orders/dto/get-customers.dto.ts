import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class GetCustomersDto {
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
  alreadyPurchase?: 'true' | 'false' = 'true';

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

//sample

// alreadyPurchase false
// page 1
// limit 10
// gender Other
// doctor 6901f794e6543fa586e3cb0e
// from 2026-02-17T18:30:00.000Z
// to 2026-02-16T18:30:00.000Z
// age 10-20
// lastVisit Custom
