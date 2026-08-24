import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type SyncLogDocument = SyncLog & Document;

@Schema({ _id: false })
export class CollectionSyncMetric {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 0 })
  count: number;

  @Prop({ required: false })
  error?: string;
}

export const CollectionSyncMetricSchema = SchemaFactory.createForClass(CollectionSyncMetric);

@Schema({ collection: 'database_sync_logs', timestamps: true, versionKey: false })
export class SyncLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  user?: Types.ObjectId;

  @Prop({ required: true, enum: ['In Progress', 'Success', 'Failed'], default: 'In Progress' })
  status: 'In Progress' | 'Success' | 'Failed';

  @Prop({ type: Date, default: Date.now })
  startedAt: Date;

  @Prop({ type: Date, required: false })
  completedAt?: Date;

  @Prop({ type: Number, default: 0 })
  durationMs: number;

  @Prop({ type: Number, default: 0 })
  totalCollections: number;

  @Prop({ type: Number, default: 0 })
  totalDocuments: number;

  @Prop({ type: [CollectionSyncMetricSchema], default: [] })
  collections: CollectionSyncMetric[];

  @Prop({ type: String, required: false })
  targetHost?: string;

  @Prop({ type: String, required: false })
  error?: string;
}

export const SyncLogSchema = SchemaFactory.createForClass(SyncLog);
