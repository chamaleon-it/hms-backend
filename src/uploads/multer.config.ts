import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');

export function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

// unique filename: 1697200000000-6f3b2c7e.pdf
export const storage = diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadsDir();
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

import { BadRequestException } from '@nestjs/common';

// File filter (accept images except svg, and pdf)
export const multerOptions = {
  storage,
  fileFilter: (req: any, file: any, cb: any) => {
    const isAllowed =
      (file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml') ||
      file.mimetype === 'application/pdf' ||
      /\.(pdf|jpg|jpeg|png|webp|gif)$/i.test(file.originalname);
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Only PDF documents and image files are allowed. SVG is strictly prohibited.'), false);
    }
  },
  // Example size cap: 50 MB
  limits: { fileSize: 50 * 1024 * 1024 },
};
