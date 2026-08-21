import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) { }

  @Post()
  @UseInterceptors(FileInterceptor('file')) // uses module-registered Multer config
  uploadSingle(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const isAllowed =
      (file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml') ||
      file.mimetype === 'application/pdf' ||
      /\.(pdf|jpg|jpeg|png|webp|gif)$/i.test(file.originalname);

    if (!isAllowed) {
      throw new BadRequestException(
        'Only PDF documents and image files are allowed.',
      );
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
