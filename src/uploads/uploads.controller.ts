import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { UPLOADS_DIR } from './multer.config';
import { existsSync, statSync } from 'fs';
import { join } from 'path';
import type { Response } from 'express';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get(':filename')
  getFile(@Param('filename') filename: string, @Res() response: Response) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(filename) || filename.includes('..')) {
      throw new BadRequestException('Invalid upload filename');
    }
    const filePath = join(UPLOADS_DIR, filename);
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      throw new NotFoundException('Upload not found');
    }
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Security-Policy', 'sandbox');
    return response.sendFile(filename, { root: UPLOADS_DIR, dotfiles: 'deny' });
  }

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
