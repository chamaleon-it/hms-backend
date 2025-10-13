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

// No type filter (accept anything). Add size cap if you want.
export const multerOptions = {
  storage,
  // Example size cap: 50 MB
  limits: { fileSize: 50 * 1024 * 1024 },
};
