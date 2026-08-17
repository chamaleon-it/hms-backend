import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type ProcedureDocument = HydratedDocument<Procedure>;

@Schema({ timestamps: true, versionKey: false })
export class SubProcedure {
  @Prop({ type: mongoose.Schema.Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 0 })
  price: number;

  @Prop({ required: false })
  code?: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ default: 'Active' })
  status: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const SubProcedureSchema = SchemaFactory.createForClass(SubProcedure);

@Schema({ timestamps: true, versionKey: false })
export class Procedure {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  code?: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: false, default: 0 })
  price?: number;

  @Prop({ default: false })
  hasSubProcedures: boolean;

  @Prop({ type: [SubProcedureSchema], default: [] })
  subProcedures: SubProcedure[];

  @Prop({ default: 'Active' })
  status: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ProcedureSchema = SchemaFactory.createForClass(Procedure);
