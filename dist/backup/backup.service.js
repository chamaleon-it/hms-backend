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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BackupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let BackupService = BackupService_1 = class BackupService {
    connection;
    logger = new common_1.Logger(BackupService_1.name);
    backupDir = path.join(process.cwd(), 'backups');
    constructor(connection) {
        this.connection = connection;
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir);
        }
    }
    async backupDatabase() {
        const session = await this.connection.startSession();
        try {
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const backupFile = path.join(this.backupDir, `${timestamp}.json`);
            if (!this.connection.db) {
                throw new Error('Database connection not established');
            }
            const collections = await this.connection.db.listCollections().toArray();
            const backupData = {};
            for (const collectionInfo of collections) {
                const collectionName = collectionInfo.name;
                const data = await this.connection.db
                    .collection(collectionName)
                    .find({})
                    .toArray();
                backupData[collectionName] = data;
            }
            fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
            this.logger.log(`Backup created at ${backupFile}`);
            return { message: 'Backup created successfully', backupId: timestamp };
        }
        catch (error) {
            this.logger.error('Backup failed', error);
            throw error;
        }
        finally {
            await session.endSession();
        }
    }
    async listBackups() {
        if (!fs.existsSync(this.backupDir)) {
            return [];
        }
        const files = fs
            .readdirSync(this.backupDir)
            .filter((f) => f.endsWith('.json'));
        return files.map((f) => path.basename(f, '.json')).reverse();
    }
    async restoreDatabase(backupId) {
        let backupPath = path.join(this.backupDir, `${backupId}.json`);
        if (!fs.existsSync(backupPath)) {
            if (fs.existsSync(path.join(this.backupDir, backupId))) {
                backupPath = path.join(this.backupDir, backupId);
            }
            else {
                throw new Error(`Backup ${backupId} not found`);
            }
        }
        const session = await this.connection.startSession();
        try {
            if (!this.connection.db) {
                throw new Error('Database connection not established');
            }
            const db = this.connection.db;
            await session.withTransaction(async () => {
                const fileContent = fs.readFileSync(backupPath, 'utf-8');
                const backupData = JSON.parse(fileContent);
                const collectionNames = Object.keys(backupData);
                for (const collectionName of collectionNames) {
                    const data = backupData[collectionName];
                    const collections = await db
                        .listCollections({ name: collectionName })
                        .toArray();
                    if (collections.length > 0) {
                        await db.collection(collectionName).deleteMany({}, { session });
                    }
                    if (Array.isArray(data) && data.length > 0) {
                        const dataToInsert = this.restoreRecursively(data);
                        await db
                            .collection(collectionName)
                            .insertMany(dataToInsert, { session });
                    }
                }
            });
            this.logger.log(`Database restored from ${backupId}`);
            return { message: 'Database restored successfully' };
        }
        catch (error) {
            this.logger.error('Restore failed', error);
            throw error;
        }
        finally {
            await session.endSession();
        }
    }
    restoreRecursively(item) {
        if (Array.isArray(item)) {
            return item.map((i) => this.restoreRecursively(i));
        }
        else if (item !== null && typeof item === 'object') {
            const newItem = {};
            for (const key of Object.keys(item)) {
                newItem[key] = this.restoreRecursively(item[key]);
            }
            return newItem;
        }
        else if (typeof item === 'string') {
            if (/^[0-9a-fA-F]{24}$/.test(item)) {
                return new mongoose_2.Types.ObjectId(item);
            }
            const isoDateRegExp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
            if (isoDateRegExp.test(item)) {
                const date = new Date(item);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }
        return item;
    }
    async restoreLatestBackup() {
        const backups = await this.listBackups();
        if (backups.length === 0) {
            throw new common_1.BadRequestException('No backups found');
        }
        return this.restoreDatabase(backups[0]);
    }
};
exports.BackupService = BackupService;
exports.BackupService = BackupService = BackupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectConnection)()),
    __metadata("design:paramtypes", [mongoose_2.Connection])
], BackupService);
//# sourceMappingURL=backup.service.js.map