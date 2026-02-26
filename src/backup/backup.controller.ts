import { Controller, Post, Get, Param } from '@nestjs/common';
import { BackupService } from './backup.service';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('create')
  async createBackup() {
    return this.backupService.backupDatabase();
  }

  @Get('list')
  async listBackups() {
    const data = await this.backupService.listBackups();
    return {
      data,
      message: 'Backups list',
      latestBackup: data[0],
    };
  }

  @Post('restore/:id')
  async restoreBackup(@Param('id') id: string) {
    return this.backupService.restoreDatabase(id);
  }

  @Post('restore_latest')
  async restoreLatestBackup() {
    return this.backupService.restoreLatestBackup();
  }
}
