import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ensureUploadsDir, multerOptions } from './multer.config';

@Module({
  imports: [
    // Register Multer globally for this module
    MulterModule.registerAsync({
      useFactory: async () => {
        ensureUploadsDir();
        return multerOptions;
      },
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
