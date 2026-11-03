"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.multerOptions = exports.storage = exports.UPLOADS_DIR = void 0;
exports.ensureUploadsDir = ensureUploadsDir;
const multer_1 = require("multer");
const path_1 = require("path");
const fs = __importStar(require("fs"));
exports.UPLOADS_DIR = (0, path_1.join)(process.cwd(), 'uploads');
function ensureUploadsDir() {
    if (!fs.existsSync(exports.UPLOADS_DIR)) {
        fs.mkdirSync(exports.UPLOADS_DIR, { recursive: true });
    }
}
exports.storage = (0, multer_1.diskStorage)({
    destination: (_req, _file, cb) => {
        ensureUploadsDir();
        cb(null, exports.UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
        cb(null, `${unique}${(0, path_1.extname)(file.originalname)}`);
    },
});
exports.multerOptions = {
    storage: exports.storage,
    limits: { fileSize: 50 * 1024 * 1024 },
};
//# sourceMappingURL=multer.config.js.map