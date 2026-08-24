import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { SyncLog, SyncLogSchema } from './schemas/sync-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SyncLog.name, schema: SyncLogSchema },
    ]),
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
