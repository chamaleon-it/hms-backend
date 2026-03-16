import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PanelsService } from './panels.service';
import { CreatePanelDto } from './dto/create-panel.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { CreateTestDto } from './dto/create-test.dto';
import mongoose from 'mongoose';
import { AddTestDto } from './dto/add-test.dto';
@Controller('lab/panels')
export class PanelsController {
  constructor(private readonly panelsService: PanelsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createPanel(
    @Body() createPanelDto: CreatePanelDto,
    @GetUser() user: JWTUserInterface,
  ) {
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

  @Delete(':name')
  @UseGuards(JwtAuthGuard)
  async deletePanel(@Param('name') name: string) {
    await this.panelsService.deletePanel(name);
    return {
      message: 'Panel deleted successfully',
    };
  }

  @Patch(':name')
  @UseGuards(JwtAuthGuard)
  async updatePanel(
    @Param('name') name: string,
    @Body() updatePanelDto: CreatePanelDto,
  ) {
    const data = await this.panelsService.updatePanel(name, updatePanelDto);
    return {
      message: 'Panel updated successfully',
      data,
    };
  }

  @Post('create_test')
  @UseGuards(JwtAuthGuard)
  async createTest(
    @Body() dto: CreateTestDto,
    @GetUser() user: JWTUserInterface,
  ) {
    dto.user = user.id;
    const data = await this.panelsService.createTest(dto);
    return {
      message: 'Test created successfully',
      data,
    };
  }

  @Get('tests')
  // @UseGuards(JwtAuthGuard)
  async getTests() {
    const data = await this.panelsService.getTests();
    return {
      message: 'Tests fetched successfully',
      data,
    };
  }

  @Patch('test/:id')
  @UseGuards(JwtAuthGuard)
  async updateTest(
    @Param('id') id: mongoose.Types.ObjectId,
    @Body() dto: CreateTestDto,
    @GetUser() user: JWTUserInterface,
  ) {
    dto.user = user.id;
    const data = await this.panelsService.updateTest(id, dto);
    return {
      message: 'Test updated successfully',
      data,
    };
  }

  @Post('add_test')
  async addTestToPanel(@Body() addTestDto: AddTestDto) {
    const data = await this.panelsService.addTestToPanel(addTestDto);
    return {
      message: 'Test added to panel successfully',
      data,
    };
  }

  @Post('remove_test')
  async removeTestFromPanel(@Body() addTestDto: AddTestDto) {
    const data = await this.panelsService.removeTestFromPanel(addTestDto);
    return {
      message: 'Test removed from panel successfully',
      data,
    };
  }
}
