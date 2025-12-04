import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file')) // uses module-registered Multer config
  uploadSingle(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return {
      message: 'File uploaded',
      data: {
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,
        url: this.uploadsService.buildPublicUrl(file.filename),
      },
    };
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 20)) // up to 20 files
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[] = []) {
    const data = files.map((f) => ({
      filename: f.filename,
      originalName: f.originalname,
      size: f.size,
      mimetype: f.mimetype,
      path: f.path,
      url: this.uploadsService.buildPublicUrl(f.filename),
    }));
    return {
      message: files.length ? 'Files uploaded' : 'No files uploaded',
      count: files.length,
      files: data,
    };
  }
}
