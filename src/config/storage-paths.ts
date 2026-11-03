import { join } from 'path';

// Cloudways does not guarantee that process.cwd() is the application directory.
// Resolve mutable storage from this module instead: src/config in development
// and dist/config in production are both two levels below the project root.
const applicationRoot = join(__dirname, '..', '..');

export const BACKUPS_DIR =
  process.env.BACKUPS_DIR?.trim() || join(applicationRoot, 'backups');
