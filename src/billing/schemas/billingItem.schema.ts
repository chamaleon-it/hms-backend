
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type BillingItemDocument = HydratedDocument<BillingItem>;

@Schema({versionKey:false})
export class BillingItem {
  @Prop({required:true,trim:true})
  item: string;

  @Prop({required:true,type:mongoose.Schema.Types.ObjectId,ref:"User",select:false})
  user:mongoose.Types.ObjectId

  
}

export const BillingItemSchema = SchemaFactory.createForClass(BillingItem);
