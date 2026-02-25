
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PharmacistDocument = HydratedDocument<Pharmacist>;

@Schema()
export class Pharmacist {
    @Prop({ required: true })
    name: string;

    @Prop({ default: "-" })
    qualification: string;

    @Prop({ default: "-" })
    designation: string;

    @Prop({ default: "-" })
    licenseNumber: string;

    @Prop({ default: false })
    isDeleted: boolean;

    @Prop({ default: false })
    inCharge: boolean;

}

export const PharmacistSchema = SchemaFactory.createForClass(Pharmacist);
