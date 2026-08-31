import { IsNumber, IsOptional, IsString } from 'class-validator';

export class NextFormattedIdDto {
  @IsOptional()
  @IsString()
  prefix?: string;

  @IsOptional()
  @IsNumber()
  padLength?: number;

  @IsOptional()
  @IsNumber()
  startValue?: number;
}

export class SetCounterDto {
  @IsNumber()
  value: number;

  @IsOptional()
  @IsString()
  prefix?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
