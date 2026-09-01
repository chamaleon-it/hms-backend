import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ReturnService } from './return.service';
import { CreateReturnDto } from './dto/create-return.dto';
import mongoose from 'mongoose';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('pharmacy/return')
@UseGuards(JwtAuthGuard)
export class ReturnController {
  constructor(private readonly returnService: ReturnService) { }

  @Post()
  async create(@Body() createReturnDto: CreateReturnDto) {
    const data = await this.returnService.create(createReturnDto);
    return {
      message: 'Successfully returned',
      data,
    };
  }

  @Get()
  async findAll() {
    const data = await this.returnService.findAll();
    return {
      data,
      message: 'All return retrieved successfully',
    };
  }

  @Get('patient/:patientId')
  async findByPatient(@Param('patientId') patientId: string) {
    const data = await this.returnService.findByPatient(patientId);
    return {
      data,
      message: 'Return data for the patient retrieved successfully',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.returnService.findOne(id);
    return {
      message: 'successfully retrieved the return data',
      data,
    };
  }
}
