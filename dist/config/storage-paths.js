"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BACKUPS_DIR = exports.UPLOADS_DIR = void 0;
const path_1 = require("path");
const applicationRoot = (0, path_1.join)(__dirname, '..', '..');
exports.UPLOADS_DIR = process.env.UPLOADS_DIR?.trim() || (0, path_1.join)(applicationRoot, 'uploads');
exports.BACKUPS_DIR = process.env.BACKUPS_DIR?.trim() || (0, path_1.join)(applicationRoot, 'backups');
//# sourceMappingURL=storage-paths.js.map