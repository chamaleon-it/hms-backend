import mongoose from 'mongoose';
import {
  AppointmentMethod,
  AppointmentStatus,
  AppointmentType,
} from '../schemas/appointment.schema';
import { Type } from 'class-transformer';
import {
  IsString,
  IsMongoId,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsOptional()
  @IsMongoId({ message: 'Patient must be a valid MongoDB ObjectId.' })
  patient?: mongoose.Types.ObjectId;

  @IsOptional()
  @IsMongoId({ message: 'Doctor must be a valid MongoDB ObjectId.' })
  doctor?: mongoose.Types.ObjectId;

  @IsOptional()
  @IsEnum(AppointmentMethod, {
    message: 'Method must be a valid appointment method.',
  })
  method?: AppointmentMethod;

  @IsOptional()
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

  @IsOptional()
  @IsBoolean({ message: 'isArrived must be a boolean value.' })
  isArrived?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isWalkIn must be a boolean value.' })
  isWalkIn?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Cash must be a number.' })
  @Min(0, { message: 'Cash cannot be negative.' })
  cash?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Card must be a number.' })
  @Min(0, { message: 'Card cannot be negative.' })
  card?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'UPI must be a number.' })
  @Min(0, { message: 'UPI cannot be negative.' })
  upi?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Discount must be a number.' })
  @Min(0, { message: 'Discount cannot be negative.' })
  discount?: number;
}
