import {
  IsString,
  IsOptional,
  ValidateNested,
  IsArray,
  IsNotEmpty,
  ArrayNotEmpty,
  IsDateString,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';

class ConsultationNotesDto {
  @IsOptional()
  @IsString({ message: 'Present history must be a string or null.' })
  presentHistory: null | string;

  @IsOptional()
  @IsString({ message: 'Past history must be a string or null.' })
  pastHistory: null | string;

  @IsOptional()
  @IsString({ message: 'Diagnosis must be a string or null.' })
  diagnosis: null | string;
}

class ExaminationNoteDto {
  @IsOptional()
  @IsString({ message: 'HR must be a string or null.' })
  hr: null | string;

  @IsOptional()
  @IsString({ message: 'BP must be a string or null.' })
  bp: null | string;

  @IsOptional()
  @IsString({ message: 'SpO2 must be a string or null.' })
  spo2: null | string;

  @IsOptional()
  @IsString({ message: 'Temperature must be a string or null.' })
  temp: null | string;

  @IsOptional()
  @IsString({ message: 'RS must be a string or null.' })
  rs: null | string;

  @IsOptional()
  @IsString({ message: 'CVS must be a string or null.' })
  cvs: null | string;

  @IsOptional()
  @IsString({ message: 'P/A must be a string or null.' })
  pa: null | string;

  @IsOptional()
  @IsString({ message: 'CNS must be a string or null.' })
  cns: null | string;

  @IsOptional()
  @IsString({ message: 'L/E must be a string or null.' })
  le: null | string;

  @IsOptional()
  @IsString({ message: 'Other notes must be a string or null.' })
  otherNotes: null | string;
}

class MedicineDto {
  @IsString({ message: 'Drug name is required and must be a string.' })
  @IsNotEmpty({ message: 'Drug name cannot be empty.' })
  drug: string;

  @IsString({ message: 'Dosage is required and must be a string.' })
  @IsNotEmpty({ message: 'Dosage cannot be empty.' })
  dosage: string;

  @IsString({ message: 'Frequency is required and must be a string.' })
  @IsNotEmpty({ message: 'Frequency cannot be empty.' })
  frequency: string;

  @IsString({ message: 'Food is required and must be a string.' })
  @IsNotEmpty({ message: 'Food cannot be empty.' })
  food: string;

  @IsString({ message: 'Duration is required and must be a string.' })
  @IsNotEmpty({ message: 'Duration cannot be empty.' })
  duration: string;
}

class TestDto {
  @IsArray({ message: 'Test names must be an array of strings.' })
  @ArrayNotEmpty({ message: 'Test names array cannot be empty.' })
  @IsString({ each: true, message: 'Each test name must be a string.' })
  name: string[];

  @IsDateString({}, { message: 'Test date must be a valid date.' })
  date: Date;

  @IsString({ message: 'Lab name is required and must be a string.' })
  @IsNotEmpty({ message: 'Lab name cannot be empty.' })
  lab: string;

  @IsString({ message: 'Slot is required and must be a string.' })
  @IsNotEmpty({ message: 'Slot cannot be empty.' })
  slot: string;

  @IsString({ message: 'Priority is required and must be a string.' })
  @IsNotEmpty({ message: 'Priority cannot be empty.' })
  priority: string;
}

export class ConsultingDto {
  @ValidateNested()
  @Type(() => ConsultationNotesDto)
  consultationNotes: ConsultationNotesDto;

  @ValidateNested()
  @Type(() => ExaminationNoteDto)
  examinationNote: ExaminationNoteDto;

  @IsArray({ message: 'Medicines must be an array.' })
  @ValidateNested({ each: true })
  @Type(() => MedicineDto)
  medicines: MedicineDto[];

  @IsOptional()
  @IsString({ message: 'Advice must be a string or null.' })
  advice: null | string;

  @IsMongoId({ message: 'Appointment must be valid id.' })
  appointment: null | string;

  @IsMongoId({ message: 'Patient must be a valid id' })
  patient: null | string;

  @IsOptional()
  @IsDateString({}, { message: 'Follow up must be a valid date or null.' })
  followUp: null | Date;

  @IsArray({ message: 'Test must be an array.' })
  @ValidateNested({ each: true })
  @Type(() => TestDto)
  test: TestDto[];
}
