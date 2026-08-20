import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Employee } from '../../schemas/employee.schema';

export type EmployeeSalaryDocument = HydratedDocument<EmployeeSalary>;

export enum SalaryPaymentStatus {
  PENDING = 'Pending',
  PAID = 'Paid',
  PARTIALLY_PAID = 'Partially Paid',
}

export enum SalaryPaymentMethod {
  CASH = 'Cash',
  BANK_TRANSFER = 'Bank Transfer',
  UPI = 'UPI',
  CHEQUE = 'Cheque',
}

@Schema({ timestamps: true, versionKey: false })
export class EmployeeSalary {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Employee.name,
    required: true,
  })
  employee: Employee;

  @Prop({ required: true })
  month: string;

  @Prop({ required: true })
  year: number;

  @Prop({ default: 0 })
  basicPay: number;

  @Prop({ default: 0 })
  hourlySalary: number;

  @Prop({ default: 0 })
  hoursWorked: number;

  @Prop({ default: 0 })
  hourlyPayTotal: number;

  @Prop({ default: 0 })
  commission: number;

  @Prop({ default: 0 })
  commissionAmount: number;

  @Prop({ default: 0 })
  allowances: number;

  @Prop({ default: 0 })
  bonus: number;

  @Prop({ default: 0 })
  grossSalary: number;

  @Prop({ default: 0 })
  deductions: number;

  @Prop({ default: 0 })
  unpaidLeaves: number;

  @Prop({ default: 0 })
  unpaidLeaveDeduction: number;

  @Prop({ default: 0 })
  netSalary: number;

  @Prop({
    required: true,
    enum: SalaryPaymentStatus,
    default: SalaryPaymentStatus.PENDING,
  })
  paymentStatus: SalaryPaymentStatus;

  @Prop({ default: 0 })
  paidAmount: number;

  @Prop({ enum: SalaryPaymentMethod })
  paymentMethod?: SalaryPaymentMethod;

  @Prop()
  paymentDate?: Date;

  @Prop({ default: '' })
  transactionReference?: string;

  @Prop({ default: '' })
  note?: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const EmployeeSalarySchema = SchemaFactory.createForClass(EmployeeSalary);
