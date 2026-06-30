import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/schemas/user.schema';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
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
