import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('status')
  async getSyncStatus() {
    const data = await this.syncService.getSyncStatus();
    return {
      data,
      message: 'Sync status retrieved successfully.',
    };
  }

  @Post('test-connection')
  async testConnection() {
    const data = await this.syncService.testAtlasConnection();
    return {
      data,
      message: 'MongoDB Atlas connection test succeeded.',
    };
  }

  @Post('atlas')
  async syncToAtlas(@GetUser() user: JWTUserInterface) {
    const data = await this.syncService.syncToAtlas(user?.id);
    return {
      data,
      message: 'Database synchronized to MongoDB Atlas successfully.',
    };
  }
}
