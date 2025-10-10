import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  NOT_ASSIGNED = 'Not assigned',
  DOCTOR = 'Doctor',
  PHARMACY = 'Pharmacy',
  LAB = 'Lab',
  ADMIN = 'Admin',
  RECEPTION = 'Reception',
  //   PATIENT = 'Patient',
}

export enum UserStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  BLOCKED = 'Blocked',
}

@Schema({
  versionKey: false,
  timestamps: true,
})
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
  })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: Date, default: Date.now })
  lastLogin: Date;

  @Prop({
    required: true,
    enum: Object.values(UserRole),
    default: UserRole.NOT_ASSIGNED,
  })
  role: string;

  @Prop({
    required: true,
    enum: Object.values(UserStatus),
    default: UserStatus.PENDING,
  })
  status: string;

  @Prop({
    default: null,
    select: false,
  })
  refreshToken?: string;

  @Prop({ trim: true, default: null })
  phoneNumber?: string;

  @Prop({ trim: true, default: null })
  address?: string;

  @Prop({ trim: true, default: null })
  profilePic?: string;

  @Prop({ type: Boolean, default: false })
  emailVerified: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
