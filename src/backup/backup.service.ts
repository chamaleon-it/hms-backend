import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.join(process.cwd(), 'backups');

  constructor(@InjectConnection() private readonly connection: Connection) {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Automatically runs daily at 5:00 AM (05:00) and 5:00 PM (17:00)
   */
  @Cron('0 5,17 * * *')
  async handleScheduledBackup() {
    this.logger.log('Starting automated scheduled database backup at 5:00...');
    try {
      const result = await this.backupDatabase();
      this.logger.log(
        `Automated scheduled backup completed successfully with ID: ${result.backupId}`,
      );
    } catch (error) {
      this.logger.error('Automated scheduled backup failed', error);
    }
  }

  /**
   * Backs up all database collections into a timestamped directory
   * with individual <database name>.<collection name>.json files (Compass format).
   */
  async backupDatabase(): Promise<{ message: string; backupId: string }> {
    if (!this.connection.db) {
      throw new Error('Database connection not established');
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFolder = path.join(this.backupDir, timestamp);

    if (!fs.existsSync(backupFolder)) {
      fs.mkdirSync(backupFolder, { recursive: true });
    }

    const dbName = this.connection.db.databaseName || this.connection.name || 'hms';
    const collections = await this.connection.db.listCollections().toArray();

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;

      // Skip internal system collections if present
      if (collectionName.startsWith('system.')) {
        continue;
      }

      const data = await this.connection.db
        .collection(collectionName)
        .find({})
        .toArray();

      const fileName = `${dbName}.${collectionName}.json`;
      const filePath = path.join(backupFolder, fileName);

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    this.logger.log(
      `Backup created successfully at ${backupFolder} (${collections.length} collections)`,
    );
    return {
      message: 'Backup created successfully',
      backupId: timestamp,
    };
  }

  /**
   * Lists all available backups (both folder backups and legacy JSON files).
   */
  async listBackups(): Promise<string[]> {
    if (!fs.existsSync(this.backupDir)) {
      return [];
    }

    const entries = fs.readdirSync(this.backupDir, { withFileTypes: true });
    const backupIds = new Set<string>();

    for (const entry of entries) {
      if (entry.isDirectory()) {
        backupIds.add(entry.name);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        backupIds.add(path.basename(entry.name, '.json'));
      }
    }

    return Array.from(backupIds).sort().reverse();
  }

  /**
   * Restores the database from a backup folder or legacy backup file.
   */
  async restoreDatabase(backupId: string) {
    const folderPath = path.join(this.backupDir, backupId);
    const legacyFilePath = path.join(this.backupDir, `${backupId}.json`);

    if (!this.connection.db) {
      throw new Error('Database connection not established');
    }

    const db = this.connection.db;

    try {
      if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
        // --- NEW FORMAT: Folder with <dbname>.<collection>.json files ---
        const files = fs
          .readdirSync(folderPath)
          .filter((f) => f.endsWith('.json'));

        if (files.length === 0) {
          throw new BadRequestException(
            `Backup folder ${backupId} contains no JSON files`,
          );
        }

        for (const file of files) {
          const baseName = path.basename(file, '.json');
          // Extract collection name from "<dbname>.<collection>" or just "<collection>"
          let collectionName = baseName;
          if (baseName.includes('.')) {
            const dotIdx = baseName.indexOf('.');
            collectionName = baseName.substring(dotIdx + 1);
          }

          const filePath = path.join(folderPath, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(fileContent);

          const collections = await db
            .listCollections({ name: collectionName })
            .toArray();
          if (collections.length > 0) {
            await db.collection(collectionName).deleteMany({});
          }

          if (Array.isArray(data) && data.length > 0) {
            const dataToInsert = this.restoreRecursively(data);
            const chunkSize = 500;
            for (let i = 0; i < dataToInsert.length; i += chunkSize) {
              const chunk = dataToInsert.slice(i, i + chunkSize);
              await db.collection(collectionName).insertMany(chunk);
            }
          }
        }

        this.logger.log(`Database restored successfully from folder ${backupId}`);
        return { message: 'Database restored successfully' };
      } else if (fs.existsSync(legacyFilePath)) {
        // --- LEGACY FORMAT: Single JSON file containing dictionary of collections ---
        const fileContent = fs.readFileSync(legacyFilePath, 'utf-8');
        const backupData = JSON.parse(fileContent);
        const collectionNames = Object.keys(backupData);

        for (const collectionName of collectionNames) {
          const data = backupData[collectionName];

          const collections = await db
            .listCollections({ name: collectionName })
            .toArray();
          if (collections.length > 0) {
            await db.collection(collectionName).deleteMany({});
          }

          if (Array.isArray(data) && data.length > 0) {
            const dataToInsert = this.restoreRecursively(data);
            const chunkSize = 500;
            for (let i = 0; i < dataToInsert.length; i += chunkSize) {
              const chunk = dataToInsert.slice(i, i + chunkSize);
              await db.collection(collectionName).insertMany(chunk);
            }
          }
        }

        this.logger.log(
          `Database restored successfully from legacy file ${backupId}.json`,
        );
        return { message: 'Database restored successfully' };
      } else {
        throw new NotFoundException(`Backup ${backupId} not found`);
      }
    } catch (error) {
      this.logger.error('Restore failed', error);
      throw error;
    }
  }

  private restoreRecursively(item: any): any {
    if (Array.isArray(item)) {
      return item.map((i) => this.restoreRecursively(i));
    } else if (item !== null && typeof item === 'object') {
      // Extended JSON format: { "$oid": "..." } or { "$date": "..." }
      if (item.$oid && typeof item.$oid === 'string') {
        return new Types.ObjectId(item.$oid);
      }
      if (
        item.$date &&
        (typeof item.$date === 'string' || typeof item.$date === 'number')
      ) {
        return new Date(item.$date);
      }

      const newItem: any = {};
      for (const key of Object.keys(item)) {
        newItem[key] = this.restoreRecursively(item[key]);
      }
      return newItem;
    } else if (typeof item === 'string') {
      // Check if string is a valid 24-hex ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(item)) {
        return new Types.ObjectId(item);
      }

      // Check if string is a valid ISO 8601 date
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
      throw new BadRequestException('No backups found');
    }
    return this.restoreDatabase(backups[0]);
  }
}

