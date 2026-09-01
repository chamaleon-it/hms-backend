import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TherapyService } from './therapy.service';
import { CreateTherapyDto } from './dto/create-therapy.dto';
import { UpdateTherapyDto } from './dto/update-therapy.dto';
import { SubTherapyDto } from './dto/sub-therapy.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('therapy')
@UseGuards(JwtAuthGuard)
export class TherapyController {
  constructor(private readonly therapyService: TherapyService) { }

  @Post()
  async create(@Body() dto: CreateTherapyDto): Promise<any> {
    const data = await this.therapyService.createTherapy(dto);
    return {
      message: 'Therapy created successfully',
      data,
    };
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ): Promise<any> {
    const data = await this.therapyService.findAll(search, status);
    return {
      message: 'Therapies retrieved successfully',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<any> {
    const data = await this.therapyService.findOne(id);
    return {
      message: 'Therapy retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTherapyDto,
  ): Promise<any> {
    const data = await this.therapyService.updateTherapy(id, dto);
    return {
      message: 'Therapy updated successfully',
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<any> {
    const data = await this.therapyService.softDeleteTherapy(id);
    return {
      message: 'Therapy deleted successfully',
      data,
    };
  }

  @Post(':id/sub-therapy')
  async addSubTherapy(
    @Param('id') id: string,
    @Body() dto: SubTherapyDto,
  ): Promise<any> {
    const data = await this.therapyService.addSubTherapy(id, dto);
    return {
      message: 'Sub-therapy added successfully',
      data,
    };
  }

  @Patch(':id/sub-therapy/:subId')
  async updateSubTherapy(
    @Param('id') id: string,
    @Param('subId') subId: string,
    @Body() dto: Partial<SubTherapyDto>,
  ): Promise<any> {
    const data = await this.therapyService.updateSubTherapy(id, subId, dto);
    return {
      message: 'Sub-therapy updated successfully',
      data,
    };
  }

  @Delete(':id/sub-therapy/:subId')
  async removeSubTherapy(
    @Param('id') id: string,
    @Param('subId') subId: string,
  ): Promise<any> {
    const data = await this.therapyService.softDeleteSubTherapy(id, subId);
    return {
      message: 'Sub-therapy deleted successfully',
      data,
    };
  }
}
