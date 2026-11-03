import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { UPLOADS_DIR } from '../config/storage-paths';

export { UPLOADS_DIR };

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
