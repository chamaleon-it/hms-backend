import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEmail,
  IsDateString,
  ValidateNested,
  IsArray,
  IsNumber,
} from 'class-validator';

class AvailabilityDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsOptional()
  startTime: string;

  @IsString()
  @IsOptional()
  endTime: string;

  @IsArray({ message: 'days must be an array' })
  @IsOptional()
  days: string[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoundsDto)
  rounds?: RoundsDto[];
}

class RoundsDto {
  @IsString()
  label: string;

  @IsString()
  start: string;

  @IsString()
  end: string;
}

export class UpdateUserDto {
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(50, { message: 'Name must be at most 50 characters' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'Phone number must be a string' })
  @IsOptional()
  phoneNumber?: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'Hospital must be a string' })
  @IsOptional()
  hospital?: string | null;

  @IsString({ message: 'Specialization must be a string' })
  @IsOptional()
  specialization?: string | null;

  @IsString({ message: 'Profile picture must be a string' })
  @IsOptional()
  profilePic?: string | null;

  @IsString({ message: 'Qualification must be a string' })
  @IsOptional()
  qualification?: string | null;

  @IsString({ message: 'License No must be a string' })
  @IsOptional()
  licenseNo?: string | null;

  @IsString({ message: 'Designation must be a string' })
  @IsOptional()
  designation?: string | null;

  @IsString({ message: 'Signature must be a string' })
  @IsOptional()
  signature?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => AvailabilityDto)
  availability?: AvailabilityDto;

  @IsString({ message: 'Status must be a string' })
  @IsOptional()
  status?: string;

  @IsNumber({}, { message: 'Consultation fee must be a number' })
  @IsOptional()
  consultationFee?: number;
}
