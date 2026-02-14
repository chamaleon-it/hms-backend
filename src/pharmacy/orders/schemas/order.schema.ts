import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderPriority {
  Normal = 'Normal',
  Stat = 'Stat',
  Routine = 'Routine',
  VIP = 'VIP',
}

export enum OrderStatus {
  Pending = 'Pending',
  Filling = 'Filling',
  Ready = 'Ready',
  Failed = 'Failed',
  Canceled = 'Canceled',
  Completed = 'Completed',
  Deleted = 'Deleted',
}

export enum PaymentStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Partial = 'Partial',
}

@Schema({ _id: false, versionKey: false })
export class OrderItem {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true })
  name: Types.ObjectId; // or rename to `item` or `itemId`

  @Prop({ default: null })
  dosage: string;

  @Prop({ default: null })
  frequency: string;

  @Prop({ default: null })
  food: string;

  @Prop({ default: null })
  duration: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true, default: false })
  isPacked: boolean;
}
export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ versionKey: false, timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  mrn: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  })
  patient: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  doctor: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], default: [] })
  items: OrderItem[];

  @Prop({
    required: true,
    enum: Object.values(OrderPriority),
    default: OrderPriority.Normal,
  })
  priority: OrderPriority;

  @Prop({
    required: true,
    enum: Object.values(OrderStatus),
    default: OrderStatus.Pending,
  })
  status: OrderStatus;

  @Prop({
    required: true,
    default: 0,
    type: Number,
  })
  discount: number;

  @Prop({ default: null })
  assignedTo: string;



  @Prop({ default: "-" })
  pharmacist: string;

  @Prop({
    required: true,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.Pending,
  })
  paymentStatus: PaymentStatus;

  @Prop({ default: 0, required: true })
  paidAmount: number;

  @Prop({ default: '-' })
  paymentReference: string;

  @Prop({ default: '-' })
  billNo: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
