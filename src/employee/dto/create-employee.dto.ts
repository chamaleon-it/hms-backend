import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { EmployeeRole } from '../schemas/employee.schema';

export class CreateEmployeeDto {
  @IsString({ message: 'Employee name must be a string' })
  @IsNotEmpty({ message: 'Employee name is required' })
  name: string;

  @IsEnum(EmployeeRole, { message: 'Role must be one of: Pharmacist, Technician, Therapist' })
  @IsNotEmpty({ message: 'Employee role is required' })
  role: EmployeeRole;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @IsOptional()
  @IsBoolean()
  inCharge?: boolean;
}
