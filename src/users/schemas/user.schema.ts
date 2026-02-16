import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  NOT_ASSIGNED = 'Not assigned',
  DOCTOR = 'Doctor',
  PHARMACY = 'Pharmacy',
  PHARMACY_WHOLESALER = 'Pharmacy Wholesaler',
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

@Schema({ _id: false })
export class Round {
  @Prop({ type: String, trim: true })
  label?: string;

  @Prop({ type: String, trim: true })
  start?: string;

  @Prop({ type: String, trim: true })
  end?: string;
}

@Schema({ _id: false })
export class Availability {
  @Prop({ type: Date, default: null })
  startDate?: Date | null;

  @Prop({ type: Date, default: null })
  endDate?: Date | null;

  @Prop({ type: String, trim: true, default: null })
  startTime?: string | null;

  @Prop({ type: String, trim: true, default: null })
  endTime?: string | null;

  @Prop({ type: [String], default: [] })
  days?: string[];

  @Prop({ type: [SchemaFactory.createForClass(Round)], default: [] })
  rounds?: Round[];
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
  hospital?: string;

  @Prop({ trim: true, default: null })
  specialization?: string;

  @Prop({ trim: true, default: null })
  signature?: string;

  @Prop({ trim: true, default: null })
  profilePic?: string;

  @Prop({ type: Boolean, default: false })
  emailVerified: boolean;

  @Prop({ type: String, default: null, select: false })
  consultationValues: string;

  @Prop({ type: SchemaFactory.createForClass(Availability), default: null })
  availability?: Availability | null;

  @Prop({
    type: {
      general: {
        owner: { type: String, default: null, trim: true },
        gstin: { type: String, default: null, trim: true, uppercase: true },
      },
      billing: {
        prefix: { type: String, default: 'INV', trim: true, uppercase: true },
        defaultGst: { type: Number, default: 5 },
        roundOff: { type: Boolean, default: false },
        autoPrintAfterSave: { type: Boolean, default: false },
        autoGenerateBill: { type: Boolean, default: false },
        autoGeneratePrescription: { type: Boolean, default: false },
      },
      inventory: {
        lowStockThreshold: { type: Number, default: 20 },
        expiryAlert: { type: Number, default: 90 },
        allowNegativeStock: { type: Boolean, default: false },
      },
      notifications: {
        whatsapp: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
        inApp: { type: Boolean, default: false },
        note: { type: String, default: null, trim: true },
      },
    },
  })
  pharmacy: {
    general: {
      owner: string | null;
      gstin: string | null;
    };
    billing: {
      prefix: string;
      defaultGst: number;
      roundOff: boolean;
      autoPrintAfterSave: boolean;
      autoGenerateBill: boolean;
    };
    inventory: {
      lowStockThreshold: number;
      expiryAlert: number;
      allowNegativeStock: boolean;
    };
    notifications: {
      whatsapp: boolean;
      sms: boolean;
      inApp: boolean;
      note: string;
    };
  };

  @Prop({
    type: {
      general: {
        owner: { type: String, default: null, trim: true },
        gstin: { type: String, default: null, trim: true, uppercase: true },
      },
      catalogue: {
        showProfilesOnPatientBill: { type: Boolean, default: false },
        allowEditingPanelComposition: { type: Boolean, default: false },
      },
      billing: {
        prefix: { type: String, default: 'INV', trim: true, uppercase: true },
        defaultGst: { type: Number, default: 5 },
        roundOff: { type: Boolean, default: false },
        autoPrintAfterSave: { type: Boolean, default: false },
      },
      notifications: {
        whatsapp: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
        inApp: { type: Boolean, default: false },
        note: { type: String, default: null, trim: true },
      },
    },
  })
  lab: {
    general: {
      owner: string | null;
      gstin: string | null;
    };
    billing: {
      prefix: string;
      defaultGst: number;
      roundOff: boolean;
      autoPrintAfterSave: boolean;
    };
    catalogue: {
      showProfilesOnPatientBill: boolean;
      allowEditingPanelComposition: boolean;
    };
    notifications: {
      whatsapp: boolean;
      sms: boolean;
      inApp: boolean;
      note: string;
    };
  };

  @Prop({
    type: {
      general: {
        contactPerson: { type: String, default: null },
        gstin: { type: String, default: null, uppercase: true },
      },
      pricing: {
        defaultMargin: { type: Number, default: 18 },
        minOrderValue: { type: Number, default: 5000 },
        creditPeriod: { type: Number, default: 30 },
        allowCreditOrder: { type: Boolean, default: false },
      },
      logistics: {
        sameDayDispatchCutOf: { type: String, default: '16:00' },
        defaultCourier: { type: String, default: null },
        returnWindow: { type: Number, default: 7 },
        allowPartialDispatch: { type: Boolean, default: false },
        autoMergeOrders: { type: Boolean, default: false },
      },
      notifications: {
        whatsapp: { type: Boolean, default: false },
        email: { type: Boolean, default: false },
        sms: { type: Boolean, default: false },
        inApp: { type: Boolean, default: false },
        note: { type: String, default: null },
      },
    },
  })
  pharmacyWholesaler: {
    general: {
      contactPerson: string | null;
      gstin: string | null;
    };
    pricing: {
      defaultMargin: number;
      minOrderValue: number;
      creditPeriod: number;
      allowCreditOrder: boolean;
    };
    logistics: {
      sameDayDispatchCutOf: string;
      defaultCourier: string;
      returnWindow: number;
      allowPartialDispatch: boolean;
      autoMergeOrders: boolean;
    };
    notifications: {
      whatsapp: boolean;
      email: boolean;
      sms: boolean;
      inApp: boolean;
      note?: string | null;
    };
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
