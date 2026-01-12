import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupService {
    private readonly logger = new Logger(BackupService.name);
    private readonly backupDir = path.join(process.cwd(), 'backups');

    constructor(@InjectConnection() private readonly connection: Connection) {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir);
        }
    }

    async backupDatabase(): Promise<{ message: string; backupId: string }> {
        const session = await this.connection.startSession();
        try {
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const backupFile = path.join(this.backupDir, `${timestamp}.json`);

            if (!this.connection.db) {
                throw new Error('Database connection not established');
            }

            const collections = await this.connection.db.listCollections().toArray();
            const backupData: Record<string, any[]> = {};

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
        } catch (error) {
            this.logger.error('Backup failed', error);
            throw error;
        } finally {
            await session.endSession();
        }
    }

    async listBackups() {
        if (!fs.existsSync(this.backupDir)) {
            return [];
        }
        const files = fs.readdirSync(this.backupDir).filter(f => f.endsWith('.json'));
        // Return names without extension for cleaner ID
        return files.map(f => path.basename(f, '.json')).reverse();
    }

    async restoreDatabase(backupId: string) {
        // Try to find the file. backupId matches the filename without extension or with?
        // Let's assume input is just timestamp (ID).
        let backupPath = path.join(this.backupDir, `${backupId}.json`);

        // Fallback for backward compatibility if user checks old folders? 
        // The user asked to change it, so let's stick to the new single file format strictly for now.
        if (!fs.existsSync(backupPath)) {
            // fallback: check if it was just passed with extension
            if (fs.existsSync(path.join(this.backupDir, backupId))) {
                backupPath = path.join(this.backupDir, backupId);
            } else {
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

                // backupData should be { collectionName: [documents] }
                const collectionNames = Object.keys(backupData);

                for (const collectionName of collectionNames) {
                    const data = backupData[collectionName];

                    const collections = await db.listCollections({ name: collectionName }).toArray();
                    if (collections.length > 0) {
                        await db.collection(collectionName).deleteMany({}, { session });
                    }

                    if (Array.isArray(data) && data.length > 0) {
                        const dataToInsert = this.restoreRecursively(data);
                        await db.collection(collectionName).insertMany(dataToInsert, { session });
                    }
                }
            });

            this.logger.log(`Database restored from ${backupId}`);
            return { message: 'Database restored successfully' };
        } catch (error) {
            this.logger.error('Restore failed', error);
            throw error;
        } finally {
            await session.endSession();
        }
    }

    private restoreRecursively(item: any): any {
        if (Array.isArray(item)) {
            return item.map(i => this.restoreRecursively(i));
        } else if (item !== null && typeof item === 'object') {
            const newItem: any = {};
            for (const key of Object.keys(item)) {
                // If the key is _id or any other field, we check the value
                newItem[key] = this.restoreRecursively(item[key]);
            }
            return newItem;
        } else if (typeof item === 'string') {
            // Check if string is a valid ObjectId (24 hex characters)
            if (/^[0-9a-fA-F]{24}$/.test(item)) {
                return new Types.ObjectId(item);
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
