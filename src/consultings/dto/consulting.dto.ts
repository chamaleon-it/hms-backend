import {
  IsString,
  IsOptional,
  ValidateNested,
  IsArray,
  IsNotEmpty,
  ArrayNotEmpty,
  IsDateString,
  IsMongoId,
  IsNumber,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import mongoose from 'mongoose';

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
  tempUnit: '°C' | '°F';

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
  @IsOptional()
  @ValidateIf((_o, val) => val !== null && val !== undefined && val !== '')
  @Transform(({ value }) => (value === '' ? null : value))
  @IsMongoId({ message: 'Drug name must be a valid Mongo ID if provided.' })
  name?: mongoose.Types.ObjectId | null;

  @IsOptional()
  @IsString()
  referralName?: string;

  @IsOptional()
  @IsBoolean()
  isCustom?: boolean;

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

  @IsNumber()
  @IsNotEmpty({ message: 'Quantity cannot be empty.' })
  quantity: number;
}

class TestDto {
  @IsArray({ message: 'Test names must be an array of strings.' })
  @ArrayNotEmpty({ message: 'Tests array cannot be empty.' })
  name: mongoose.Types.ObjectId[];

  @IsDateString({}, { message: 'Test date must be a valid date.' })
  date: Date;

  @IsOptional()
  @Transform(({ value }) =>
    !value ||
    typeof value !== 'string' ||
    value.trim() === '' ||
    !mongoose.isValidObjectId(value)
      ? undefined
      : value,
  )
  lab?: mongoose.Types.ObjectId;

  @IsString({ message: 'Priority is required and must be a string.' })
  @IsNotEmpty({ message: 'Priority cannot be empty.' })
  priority: string;

  panels: string[];
}

class MedicalParametersDto {
  @IsOptional()
  @IsString()
  sleep?: null | string;

  @IsOptional()
  @IsString()
  bowelMovement?: null | string;

  @IsOptional()
  @IsString()
  urineMovement?: null | string;

  @IsOptional()
  @IsString()
  appetite?: null | string;
}

export class ConsultingDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ConsultationNotesDto)
  consultationNotes?: ConsultationNotesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ExaminationNoteDto)
  examinationNote?: ExaminationNoteDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MedicalParametersDto)
  medicalParameters?: MedicalParametersDto;

  @IsOptional()
  @IsArray({ message: 'Medicines must be an array.' })
  @ValidateNested({ each: true })
  @Type(() => MedicineDto)
  medicines?: MedicineDto[];

   @IsOptional()
  therapy: any;

  @IsOptional()
  @IsString({ message: 'Therapy notes must be a string or null.' })
  therapyNotes: null | string;

  @IsOptional()
  procedure: any;

  @IsOptional()
  @IsString({ message: 'Procedure notes must be a string or null.' })
  procedureNotes: null | string;

  @IsOptional()
  @IsString({ message: 'Advice must be a string or null.' })
  advice: null | string;

  @IsMongoId({ message: 'Appointment must be valid id.' })
  appointment: null | string;

  @IsMongoId({ message: 'Patient must be a valid id' })
  patient: mongoose.Types.ObjectId;

  @IsOptional()
  @IsDateString({}, { message: 'Follow up must be a valid date or null.' })
  followUp: null | Date;

  @IsArray({ message: 'Test must be an array.' })
  @ValidateNested({ each: true })
  @Type(() => TestDto)
  test: TestDto[];

  @IsOptional()
  @IsString()
  consultationType?: string;

  @IsOptional()
  chiefComplaints?: {
    complaints: string[];
    other: string | null;
    duration: string | null;
    painScore: number | null;
  };

  @IsOptional()
  lifestyle?: {
    sleep: string | null;
    bowel: string | null;
    appetite: string | null;
    stress: string | null;
    exercise: string | null;
    smoking: string | null;
    alcohol: string | null;
    micturition: string | null;
  };

  @IsOptional()
  acupunctureAssessment?: {
    clinicalDiagnosis: string | null;
    treatmentPrinciple: string | null;
  };

  @IsOptional()
  treatmentPlan?: {
    sessions: string | null;
    frequency: string | null;
    homeCare: string[];
  };

  @IsOptional()
  medicalHistoryDetails?: {
    medHistory: string[];
    otherMedHistory: string | null;
    currentMedications: string | null;
    allergies: string | null;
  };

  @IsOptional()
  acupunctureExamination?: {
    bp: string | null;
    pulse: string | null;
    tenderness: string | null;
    rom: string | null;
    posture: string | null;
    specialFindings: string | null;
  };

  @IsOptional()
  followUpDetails?: {
    nextAppt: Date | null;
    feedback: string | null;
    additionalNotes: string | null;
    signature: string | null;
  };
}
