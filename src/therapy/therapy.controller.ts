import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TherapyService } from './therapy.service';
import { CreateTherapyDto } from './dto/create-therapy.dto';
import { UpdateTherapyDto } from './dto/update-therapy.dto';

@Controller('therapy')
export class TherapyController {
  constructor(private readonly therapyService: TherapyService) {}

  @Post()
  async create(@Body() dto: CreateTherapyDto) {
    const data = await this.therapyService.createTherapy(dto);
    return {
      message: 'Therapy created successfully',
      data,
    };
  }

  @Get()
  async findAll(@Query('search') search?: string) {
    const data = await this.therapyService.findAll(search);
    return {
      message: 'Therapies retrieved successfully',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.therapyService.findOne(id);
    return {
      message: 'Therapy retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTherapyDto) {
    const data = await this.therapyService.updateTherapy(id, dto);
    return {
      message: 'Therapy updated successfully',
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.therapyService.softDeleteTherapy(id);
    return {
      message: 'Therapy deleted successfully',
      data,
    };
  }
}
