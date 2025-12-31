import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';

@Controller('sync')
export class SyncController {
    constructor(private readonly syncService: SyncService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async sync(
        @Body() pendingActions: any[],
        @GetUser() user: JWTUserInterface,
    ) {
        const results = await this.syncService.processActions(pendingActions, user.id.toString());
        return {
            message: 'Sync completed',
            results,
        };
    }
}
