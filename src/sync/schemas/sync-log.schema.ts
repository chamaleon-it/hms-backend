import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class SyncLog extends Document {
    @Prop({ required: true, unique: true })
    actionId: string;

    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    status: string;
}

export const SyncLogSchema = SchemaFactory.createForClass(SyncLog);
