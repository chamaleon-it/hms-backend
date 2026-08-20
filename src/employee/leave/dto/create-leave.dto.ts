import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { LeaveStatus, LeaveType } from '../schemas/employee-leave.schema';

export class CreateLeaveDto {
  @IsMongoId({ message: 'Employee ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Employee ID is required' })
  employee: string;

  @IsEnum(LeaveType, { message: 'Invalid leave type' })
  @IsNotEmpty({ message: 'Leave type is required' })
  leaveType: LeaveType;

  @IsNotEmpty({ message: 'Start date is required' })
  startDate: string | Date;

  @IsNotEmpty({ message: 'End date is required' })
  endDate: string | Date;

  @IsNumber({}, { message: 'Days count must be a number' })
  @Min(0.5, { message: 'Days count must be at least 0.5' })
  daysCount: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @IsOptional()
  @IsString()
  approvalNote?: string;
}
