
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SupplierDocument = HydratedDocument<Supplier>;

export enum SupplierStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
}

@Schema({ timestamps: true, versionKey: false })
export class Supplier {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ required: false })
    contactPerson?: string;

    @Prop({ required: false })
    designation?: string;

    @Prop({ required: false })
    email?: string;

    @Prop({
        type: {
            line1: String,
            line2: String,
            city: String,
            state: String,
        }
    })
    address: {
        line1: string;
        line2?: string;
        city?: string;
        state?: string;
    };

    @Prop({ required: false })
    gstin?: string;

    @Prop({ required: false })
    msme?: string;

    @Prop({ required: false })
    pan?: string;

    @Prop({ required: false })
    dlNo?: string;

    @Prop({ type: Date, required: false })
    dlExpiryDate?: Date;

    @Prop({ default: 0 })
    balance: number;

    @Prop({ default: 30 })
    paymentTerms: Number;

    @Prop({ required: false })
    description?: string;

    @Prop({ default: SupplierStatus.ACTIVE })
    status: SupplierStatus;

    @Prop({ default: false })
    isDeleted: boolean;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
