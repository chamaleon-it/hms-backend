import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CertificateGender } from '../schemas/medical-certificate.schema';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateMedicalCertificateDto {
  @Transform(trimString)
  @IsString({ message: 'Patient name must be a string.' })
  @IsNotEmpty({ message: 'Patient name is required.' })
  @MaxLength(120, { message: 'Patient name is too long.' })
  patientName: string;

  @Transform(({ value }) =>
    value === null || value === undefined ? value : String(value).trim(),
  )
  @IsString({ message: 'Age must be a string.' })
  @IsNotEmpty({ message: 'Age is required.' })
  @MaxLength(20, { message: 'Age is too long.' })
  age: string;

  @IsEnum(CertificateGender, {
    message: 'Gender must be Male or Female.',
  })
  gender: CertificateGender;

  @Transform(trimString)
  @IsString({ message: 'Reason must be a string.' })
  @IsNotEmpty({ message: 'Reason is required.' })
  @MaxLength(300, { message: 'Reason is too long.' })
  reason: string;

  @IsDateString({}, { message: 'From date must be a valid date.' })
  dateFrom: string;

  @IsDateString({}, { message: 'To date must be a valid date.' })
  dateTo: string;

  @IsMongoId({ message: 'Select an existing doctor.' })
  doctor: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'Qualification must be a string.' })
  @MaxLength(120, { message: 'Qualification is too long.' })
  doctorQualification?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: 'Registration number must be a string.' })
  @MaxLength(80, { message: 'Registration number is too long.' })
  doctorRegistrationNumber?: string;

  @IsOptional()
  @IsMongoId({ message: 'Patient id is not valid.' })
  patient?: string;
}
