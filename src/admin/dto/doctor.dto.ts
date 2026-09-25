import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { UserStatus } from '../../users/schemas/user.schema';

class DoctorRoundDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  start?: string;

  @IsString()
  @IsOptional()
  end?: string;
}

export class DoctorAvailabilityDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsArray()
  @IsOptional()
  days?: string[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DoctorRoundDto)
  rounds?: DoctorRoundDto[];

  @IsOptional()
  slotIntervalMinutes?: number;
}

export class CreateDoctorDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  hospital?: string;

  @IsString()
  @IsOptional()
  specialization?: string;

  @IsString()
  @IsOptional()
  qualification?: string;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsString()
  @IsOptional()
  signature?: string;

  @IsString()
  @IsOptional()
  profilePic?: string;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => DoctorAvailabilityDto)
  availability?: DoctorAvailabilityDto;
}

export class UpdateDoctorDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string | null;

  @IsString()
  @IsOptional()
  address?: string | null;

  @IsString()
  @IsOptional()
  hospital?: string | null;

  @IsString()
  @IsOptional()
  specialization?: string | null;

  @IsString()
  @IsOptional()
  qualification?: string | null;

  @IsString()
  @IsOptional()
  designation?: string | null;

  @IsString()
  @IsOptional()
  signature?: string | null;

  @IsString()
  @IsOptional()
  profilePic?: string | null;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => DoctorAvailabilityDto)
  availability?: DoctorAvailabilityDto | null;
}

export class UpdateDoctorAvailabilityBodyDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => DoctorAvailabilityDto)
  availability?: DoctorAvailabilityDto | null;
}
