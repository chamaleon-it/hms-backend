import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Test } from './test.schema';
import { Panel } from './panel.schema';

export enum GroupStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  DELETED = 'Deleted',
}

export type GroupDocument = Group & Document;

@Schema({ timestamps: true })
export class Group {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  price: number;

  @Prop({ type: String, enum: GroupStatus, default: GroupStatus.ACTIVE })
  status: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }] })
  tests: Test[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Panel' }] })
  panels: Panel[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: any;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
