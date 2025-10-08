import mongoose from 'mongoose';
import {
  AppointmentMethod,
  AppointmentStatus,
  AppointmentType,
} from '../schemas/appointment.schema';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsMongoId,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsString({ message: 'Patient name must be a string.' })
  @IsNotEmpty({ message: 'Patient name is required.' })
  patientName: string;

  @IsString({ message: 'Phone number must be a string.' })
  @IsNotEmpty({ message: 'Phone number is required.' })
  phoneNumber: string;

  @IsEmail({}, { message: 'Email must be a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  @IsMongoId({ message: 'Doctor must be a valid MongoDB ObjectId.' })
  doctor: mongoose.Types.ObjectId;

  @IsOptional()
  @IsEnum(AppointmentMethod, {
    message: 'Method must be a valid appointment method.',
  })
  method?: AppointmentMethod;

  @IsDateString({}, { message: 'Date must be a valid ISO date string.' })
  date: Date;

  @IsOptional()
  @IsString({ message: 'Notes must be a string.' })
  notes?: string;

  @IsOptional()
  @IsString({ message: 'Internal notes must be a string.' })
  internalNotes?: string;

  @IsOptional()
  @IsEnum(AppointmentType, {
    message: 'Type must be a valid appointment type.',
  })
  type?: AppointmentType;

  @IsOptional()
  @IsEnum(AppointmentStatus, {
    message: 'Status must be a valid appointment status.',
  })
  status?: AppointmentStatus;

  @IsOptional()
  @IsBoolean({ message: 'isPaid must be a boolean value.' })
  isPaid?: boolean;
}
