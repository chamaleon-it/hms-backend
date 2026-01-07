import { Transform } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsIn,
  MaxLength,
  IsArray,
} from 'class-validator';

export class PatientRegisterDto {
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  name: string;

  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  phoneNumber: string;

  // @IsEmail({}, { message: 'Invalid email address' })
  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => value?.trim().toUpperCase())
  mrn?: string;

  @IsString()
  doctor: string;

  @IsIn(['Male', 'Female', 'Other', 'Prefer not to say'])
  gender: string;

  @IsString()
  dateOfBirth: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value == null) return undefined;
    // If already an array, normalize items to strings and trim
    if (Array.isArray(value))
      return value.map((v) => String(v).trim()).filter(Boolean);
    // If a single string (possibly comma-separated), split into items
    const str = String(value).trim();
    if (!str) return undefined;
    return str.includes(',')
      ? str
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      : [str];
  })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  conditions?: string[];

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
  insurance?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  insuranceValidity?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  uhid?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  emergencyContactNumber?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  address?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  notes?: string;
}
