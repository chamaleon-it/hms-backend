import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type PanelDocument = HydratedDocument<Panel>;

export enum PanelStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  DELETED = 'Deleted',
}

@Schema({ versionKey: false })
export class Panel {
  @Prop({ unique: true, required: true, trim: true })
  name: string;

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop({
    type: String,
    enum: Object.values(PanelStatus),
    default: PanelStatus.ACTIVE,
  })
  status: PanelStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: mongoose.Types.ObjectId;

  @Prop({ default: 0 })
  estimatedTime: number;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Test', default: [] })
  tests: mongoose.Types.ObjectId[];
}

export const PanelSchema = SchemaFactory.createForClass(Panel);
