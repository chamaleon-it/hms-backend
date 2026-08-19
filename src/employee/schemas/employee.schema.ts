import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EmployeeDocument = HydratedDocument<Employee>;

export enum EmployeeRole {
  PHARMACIST = 'Pharmacist',
  TECHNICIAN = 'Technician',
  THERAPIST = 'Therapist',
}

@Schema({ timestamps: true, versionKey: false })
export class Employee {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: EmployeeRole })
  role: EmployeeRole;

  @Prop({ default: '' })
  phone?: string;

  @Prop({ default: '' })
  email?: string;

  @Prop({ default: '' })
  gender?: string;

  @Prop({ default: '' })
  employeeId?: string;

  @Prop({ default: '' })
  qualification?: string;

  @Prop({ default: '' })
  designation?: string;

  @Prop({ default: '' })
  specialization?: string;

  @Prop({ default: '' })
  licenseNumber?: string;

  @Prop({ default: '' })
  address?: string;

  @Prop({ default: 'Active' })
  status: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: false })
  inCharge: boolean;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
