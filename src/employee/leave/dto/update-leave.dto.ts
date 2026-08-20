import { PartialType } from '@nestjs/mapped-types';
import { CreateLeaveDto } from './create-leave.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LeaveStatus } from '../schemas/employee-leave.schema';

export class UpdateLeaveDto extends PartialType(CreateLeaveDto) {
  @IsOptional()
  @IsEnum(LeaveStatus)
  status?: LeaveStatus;

  @IsOptional()
  @IsString()
  approvedBy?: string;

  @IsOptional()
  @IsString()
  approvalNote?: string;
}

export class UpdateLeaveStatusDto {
  @IsEnum(LeaveStatus, { message: 'Status must be Pending, Approved, Rejected, or Cancelled' })
  status: LeaveStatus;

  @IsOptional()
  @IsString()
  approvalNote?: string;

  @IsOptional()
  @IsString()
  approvedBy?: string;
}
