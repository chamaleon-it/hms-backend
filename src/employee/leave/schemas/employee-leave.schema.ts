import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Employee } from '../../schemas/employee.schema';

export type EmployeeLeaveDocument = HydratedDocument<EmployeeLeave>;

export enum LeaveType {
  CASUAL = 'Casual Leave',
  SICK = 'Sick Leave',
  EARNED = 'Earned Leave',
  MATERNITY_PATERNITY = 'Maternity / Paternity Leave',
  UNPAID = 'Unpaid Leave',
  OTHER = 'Other',
}

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
}

@Schema({ timestamps: true, versionKey: false })
export class EmployeeLeave {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Employee.name,
    required: true,
  })
  employee: Employee;

  @Prop({ required: true, enum: LeaveType, default: LeaveType.CASUAL })
  leaveType: LeaveType;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true, default: 1 })
  daysCount: number;

  @Prop({ default: '' })
  reason: string;

  @Prop({ required: true, enum: LeaveStatus, default: LeaveStatus.PENDING })
  status: LeaveStatus;

  @Prop({ default: Date.now })
  appliedDate: Date;

  @Prop({ default: '' })
  approvedBy?: string;

  @Prop({ default: '' })
  approvalNote?: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const EmployeeLeaveSchema = SchemaFactory.createForClass(EmployeeLeave);
