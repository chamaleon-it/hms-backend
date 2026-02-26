import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
