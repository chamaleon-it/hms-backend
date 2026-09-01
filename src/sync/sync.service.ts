import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Connection, Model } from 'mongoose';
import configuration from 'src/config/configuration';
import { SyncLog, SyncLogDocument } from './schemas/sync-log.schema';

@Injectable()
export class SyncService implements OnModuleInit {
  private readonly logger = new Logger(SyncService.name);
  private isSyncing = false;

  constructor(
    @InjectConnection() private readonly localConnection: Connection,
    @InjectModel(SyncLog.name) private readonly syncLogModel: Model<SyncLogDocument>,
  ) {}

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
            .catch(() => {});
        }
      }
    } catch {
      // Ignore cleanup error
    }
  }

  private getAtlasUrl(): string {
    const url =
      configuration().atlasDatabaseUrl ||
      process.env.ATLAS_DATABASE_URL ||
      process.env.MONGO_ATLAS_URI;
    if (!url) {
      throw new BadRequestException(
        'MongoDB Atlas connection URL is not configured. Please set ATLAS_DATABASE_URL in .env.',
      );
    }
    return url;
  }

  private maskUrl(url: string): string {
    try {
      const parsed = new URL(url);
      const host = parsed.host;
      const pathname = parsed.pathname || '';
      return `${host}${pathname}`;
    } catch {
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
    } catch {
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
    let tempConn: Connection | null = null;

    try {
      tempConn = await mongoose
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
    } catch (error: any) {
      this.logger.error(`Atlas connection test failed: ${error.message}`);
      throw new BadRequestException(
        `Failed to connect to MongoDB Atlas (${maskedHost}): ${error.message}`,
      );
    } finally {
      if (tempConn) {
        await tempConn.close().catch(() => {});
      }
    }
  }

  async syncToAtlas(userId?: string | mongoose.Types.ObjectId) {
    if (this.isSyncing) {
      throw new BadRequestException(
        'A database synchronization is already in progress. Please wait for it to complete.',
      );
    }

    const atlasUrl = this.getAtlasUrl();
    const maskedHost = this.maskUrl(atlasUrl);

    if (!this.localConnection.db) {
      throw new InternalServerErrorException('Local database connection is not available');
    }

    this.isSyncing = true;
    const startTime = Date.now();

    const userObjId = userId
      ? typeof userId === 'string'
        ? new mongoose.Types.ObjectId(userId)
        : userId
      : undefined;

    const syncLog = await this.syncLogModel.create({
      user: userObjId,
      status: 'In Progress',
      startedAt: new Date(),
      targetHost: maskedHost,
      collections: [],
    });

    let atlasConn: Connection | null = null;

    try {
      this.logger.log(`Starting database synchronization to Atlas (${maskedHost})...`);

      atlasConn = await mongoose
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
        .filter(
          (name) =>
            !name.startsWith('system.') &&
            name !== 'synclogs' &&
            name !== 'database_sync_logs' &&
            name !== 'sessions',
        );

      const collectionMetrics: Array<{ name: string; count: number; error?: string }> = [];
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
          let batch: any[] = [];
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
        } catch (colErr: any) {
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

      this.logger.log(
        `Database synchronization completed successfully in ${durationMs}ms. Total documents synced: ${totalDocumentsSynced}`,
      );

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
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      this.logger.error(`Database synchronization failed: ${error.message}`, error.stack);

      syncLog.status = 'Failed';
      syncLog.completedAt = new Date();
      syncLog.durationMs = durationMs;
      syncLog.error = error.message;
      await syncLog.save().catch(() => {});

      throw new InternalServerErrorException(
        `Database synchronization to Atlas failed: ${error.message}`,
      );
    } finally {
      this.isSyncing = false;
      if (atlasConn) {
        await atlasConn.close().catch(() => {});
      }
    }
  }
}
