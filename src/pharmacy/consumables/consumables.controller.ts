import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConsumablesService } from './consumables.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/schemas/user.schema';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { IssueConsumableDto } from './dto/issue-consumable.dto';

@Controller('pharmacy/consumables')
export class ConsumablesController {
  constructor(private readonly consumablesService: ConsumablesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(@Query('q') q?: string) {
    const data = await this.consumablesService.listConsumables(q);
    return {
      data,
      message: 'Consumables retrieved successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('issues')
  async listIssues(@Query('limit') limit?: string) {
    const data = await this.consumablesService.listIssues(
      limit ? Number(limit) : 50,
    );
    return {
      data,
      message: 'Consumable issues retrieved successfully',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACY, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('issue')
  async issue(
    @GetUser() user: JWTUserInterface,
    @Body() dto: IssueConsumableDto,
  ) {
    const data = await this.consumablesService.issue(user.id, dto);
    return {
      data,
      message: 'Consumable issued successfully',
    };
  }
}
