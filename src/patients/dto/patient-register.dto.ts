import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsEmail, IsIn, IsNumber } from 'class-validator';

export class PatientRegisterDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  phoneNumber: string;

  @IsEmail()
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  email: string;

  @IsIn(['Male', 'Female', 'Other'])
  gender: string;

  @IsNumber()
  age: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  condition?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  blood?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  allergies?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  address?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  notes?: string;
}
