import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsEmail, IsIn, IsNumber } from 'class-validator';

export class PatientRegisterDto {
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  name: string;

  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
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
  @Transform(({ value }: { value: string }) => value.trim())
  condition?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  blood?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  allergies?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  address?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  notes?: string;
}
