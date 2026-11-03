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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = __importStar(require("mongoose"));
const configuration_1 = __importDefault(require("../config/configuration"));
const sync_log_schema_1 = require("./schemas/sync-log.schema");
let SyncService = SyncService_1 = class SyncService {
    localConnection;
    syncLogModel;
    logger = new common_1.Logger(SyncService_1.name);
    isSyncing = false;
    constructor(localConnection, syncLogModel) {
        this.localConnection = localConnection;
        this.syncLogModel = syncLogModel;
    }
    async onModuleInit() {
        try {
            if (this.localConnection.db) {
                const collections = await this.localConnection.db
                    .listCollections({ name: 'synclogs' })
                    .toArray();
                if (collections.length > 0) {
                    await this.localConnection.db
                        .collection('synclogs')
                        .dropIndex('actionId_1')
                        .catch(() => { });
                }
            }
        }
        catch {
        }
    }
    getAtlasUrl() {
        const url = (0, configuration_1.default)().atlasDatabaseUrl ||
            process.env.ATLAS_DATABASE_URL ||
            process.env.MONGO_ATLAS_URI;
        if (!url) {
            throw new common_1.BadRequestException('MongoDB Atlas connection URL is not configured. Please set ATLAS_DATABASE_URL in .env.');
        }
        return url;
    }
    maskUrl(url) {
        try {
            const parsed = new URL(url);
            const host = parsed.host;
            const pathname = parsed.pathname || '';
            return `${host}${pathname}`;
        }
        catch {
            return url.replace(/\/\/.*@/, '//***:***@');
        }
    }
    async getSyncStatus() {
        const lastSync = await this.syncLogModel
            .findOne()
            .sort({ createdAt: -1 })
            .populate('user', 'name role email')
            .lean()
            .exec();
        let atlasConfigured = false;
        let maskedTarget = 'Not Configured';
        try {
            const url = this.getAtlasUrl();
            atlasConfigured = true;
            maskedTarget = this.maskUrl(url);
        }
        catch {
            atlasConfigured = false;
        }
        return {
            isSyncing: this.isSyncing,
            lastSync,
            atlasConfigured,
            targetHost: maskedTarget,
        };
    }
    async testAtlasConnection() {
        const atlasUrl = this.getAtlasUrl();
        const maskedHost = this.maskUrl(atlasUrl);
        let tempConn = null;
        try {
            tempConn = await mongoose_2.default
                .createConnection(atlasUrl, {
                serverSelectionTimeoutMS: 8000,
                connectTimeoutMS: 8000,
            })
                .asPromise();
            if (!tempConn.db) {
                throw new Error('Database handle not available on Atlas connection');
            }
            await tempConn.db.admin().ping();
            return {
                success: true,
                message: 'Successfully connected to MongoDB Atlas.',
                host: maskedHost,
            };
        }
        catch (error) {
            this.logger.error(`Atlas connection test failed: ${error.message}`);
            throw new common_1.BadRequestException(`Failed to connect to MongoDB Atlas (${maskedHost}): ${error.message}`);
        }
        finally {
            if (tempConn) {
                await tempConn.close().catch(() => { });
            }
        }
    }
    async syncToAtlas(userId) {
        if (this.isSyncing) {
            throw new common_1.BadRequestException('A database synchronization is already in progress. Please wait for it to complete.');
        }
        const atlasUrl = this.getAtlasUrl();
        const maskedHost = this.maskUrl(atlasUrl);
        if (!this.localConnection.db) {
            throw new common_1.InternalServerErrorException('Local database connection is not available');
        }
        this.isSyncing = true;
        const startTime = Date.now();
        const userObjId = userId
            ? typeof userId === 'string'
                ? new mongoose_2.default.Types.ObjectId(userId)
                : userId
            : undefined;
        const syncLog = await this.syncLogModel.create({
            user: userObjId,
            status: 'In Progress',
            startedAt: new Date(),
            targetHost: maskedHost,
            collections: [],
        });
        let atlasConn = null;
        try {
            this.logger.log(`Starting database synchronization to Atlas (${maskedHost})...`);
            atlasConn = await mongoose_2.default
                .createConnection(atlasUrl, {
                serverSelectionTimeoutMS: 15000,
                connectTimeoutMS: 15000,
            })
                .asPromise();
            if (!atlasConn.db) {
                throw new Error('Could not establish database handle to MongoDB Atlas');
            }
            const atlasDb = atlasConn.db;
            const localDb = this.localConnection.db;
            const collectionsInfo = await localDb.listCollections().toArray();
            const collectionsToSync = collectionsInfo
                .map((c) => c.name)
                .filter((name) => !name.startsWith('system.') &&
                name !== 'synclogs' &&
                name !== 'database_sync_logs' &&
                name !== 'sessions');
            const collectionMetrics = [];
            let totalDocumentsSynced = 0;
            for (const colName of collectionsToSync) {
                try {
                    const localCol = localDb.collection(colName);
                    const atlasCol = atlasDb.collection(colName);
                    const docCount = await localCol.countDocuments();
                    if (docCount === 0) {
                        collectionMetrics.push({ name: colName, count: 0 });
                        continue;
                    }
                    const cursor = localCol.find({});
                    let batch = [];
                    let colSynced = 0;
                    for await (const doc of cursor) {
                        batch.push(doc);
                        if (batch.length >= 500) {
                            const operations = batch.map((item) => ({
                                replaceOne: {
                                    filter: { _id: item._id },
                                    replacement: item,
                                    upsert: true,
                                },
                            }));
                            await atlasCol.bulkWrite(operations, { ordered: false });
                            colSynced += batch.length;
                            batch = [];
                        }
                    }
                    if (batch.length > 0) {
                        const operations = batch.map((item) => ({
                            replaceOne: {
                                filter: { _id: item._id },
                                replacement: item,
                                upsert: true,
                            },
                        }));
                        await atlasCol.bulkWrite(operations, { ordered: false });
                        colSynced += batch.length;
                        batch = [];
                    }
                    totalDocumentsSynced += colSynced;
                    collectionMetrics.push({ name: colName, count: colSynced });
                    this.logger.log(`Synced collection "${colName}": ${colSynced} documents.`);
                }
                catch (colErr) {
                    this.logger.error(`Error syncing collection ${colName}: ${colErr.message}`);
                    collectionMetrics.push({
                        name: colName,
                        count: 0,
                        error: colErr.message,
                    });
                }
            }
            const durationMs = Date.now() - startTime;
            syncLog.status = 'Success';
            syncLog.completedAt = new Date();
            syncLog.durationMs = durationMs;
            syncLog.totalCollections = collectionMetrics.length;
            syncLog.totalDocuments = totalDocumentsSynced;
            syncLog.collections = collectionMetrics;
            await syncLog.save();
            this.logger.log(`Database synchronization completed successfully in ${durationMs}ms. Total documents synced: ${totalDocumentsSynced}`);
            return {
                success: true,
                message: 'Database synchronized to MongoDB Atlas successfully.',
                targetHost: maskedHost,
                durationMs,
                totalCollections: collectionMetrics.length,
                totalDocuments: totalDocumentsSynced,
                collections: collectionMetrics,
                syncedAt: syncLog.completedAt,
            };
        }
        catch (error) {
            const durationMs = Date.now() - startTime;
            this.logger.error(`Database synchronization failed: ${error.message}`, error.stack);
            syncLog.status = 'Failed';
            syncLog.completedAt = new Date();
            syncLog.durationMs = durationMs;
            syncLog.error = error.message;
            await syncLog.save().catch(() => { });
            throw new common_1.InternalServerErrorException(`Database synchronization to Atlas failed: ${error.message}`);
        }
        finally {
            this.isSyncing = false;
            if (atlasConn) {
                await atlasConn.close().catch(() => { });
            }
        }
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = SyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectConnection)()),
    __param(1, (0, mongoose_1.InjectModel)(sync_log_schema_1.SyncLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Connection,
        mongoose_2.Model])
], SyncService);
//# sourceMappingURL=sync.service.js.map