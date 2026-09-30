import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { TallyService } from './tally.service';
import { ConnectTallyDto } from './dto/connect-tally.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { UserRole } from 'src/users/schemas/user.schema';

@Controller('tally')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ACCOUNTANT, UserRole.ADMIN)
export class TallyController {
  constructor(private readonly tallyService: TallyService) {}

  @Get('status')
  async status() {
    const data = await this.tallyService.getStatus();
    return {
      data,
      message: data.connected
        ? 'Tally is connected'
        : 'Tally is not connected',
    };
  }

  @Post('connect')
  async connect(
    @Body() dto: ConnectTallyDto,
    @GetUser() user: JWTUserInterface,
  ) {
    const data = await this.tallyService.connect(dto, user?.id);
    return {
      data,
      message: `Connected to Tally on ${data.host}:${data.port}`,
    };
  }

  @Post('disconnect')
  async disconnect() {
    const data = await this.tallyService.disconnect();
    return {
      data,
      message: 'Disconnected from Tally',
    };
  }

  @Post('test')
  async test() {
    const data = await this.tallyService.testConnection();
    return {
      data,
      message: data.message,
    };
  }

  @Post('sync')
  async sync() {
    const data = await this.tallyService.syncPending();
    return {
      data,
      message: data.message,
    };
  }
}
