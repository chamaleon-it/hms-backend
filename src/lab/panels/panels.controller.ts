import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PanelsService } from './panels.service';
import { CreatePanelDto } from './dto/create-panel.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import mongoose from 'mongoose';

@Controller('lab/panels')
export class PanelsController {
  constructor(private readonly panelsService: PanelsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createPanel(@Body() createPanelDto: CreatePanelDto,@GetUser() user:JWTUserInterface) {
    createPanelDto.user = user.id;
    const data = await this.panelsService.createPanel(createPanelDto);
    return {
      message: 'Panel created successfully',
      data,
    };
  }

  @Get()
  async getPanels() {
    const data = await this.panelsService.getPanels();
    return {
      message: 'Panels fetched successfully',
      data,
    };
  }

  @Delete(":name")
  @UseGuards(JwtAuthGuard)
  async deletePanel(@Param('name') name: string) {
    await this.panelsService.deletePanel(name);
    return {
      message: 'Panel deleted successfully',
    };
  }

  

}
