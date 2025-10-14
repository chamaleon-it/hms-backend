import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadsService {
  buildPublicUrl(filename: string) {
    return `/uploads/${filename}`;
  }
}
