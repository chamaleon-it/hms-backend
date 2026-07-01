import { Controller, Post, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { JWTUserInterface } from '../interface/jwt-user.interface';
import mongoose from 'mongoose';

@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createConsultation(
    @Body() createConsultationDto: CreateConsultationDto,
    @GetUser() user: JWTUserInterface,
  ) {
    const data = await this.consultationsService.createConsultation(createConsultationDto);
    return {
      data,
      message: 'Consultation created or retrieved successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('appointment/:appointmentId')
  async getConsultationByAppointment(@Param('appointmentId') appointmentId: mongoose.Types.ObjectId) {
    const data = await this.consultationsService.getConsultationByAppointment(appointmentId);
    return {
      data,
      message: 'Consultation retrieved successfully',
    };
  }

  @Get(':id')
  async getConsultationById(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.consultationsService.getConsultationById(id);
    return {
      data,
      message: 'Consultation retrieved successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/start')
  async startConsultation(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.consultationsService.startConsultation(id);
    return {
      data,
      message: 'Consultation started successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/end')
  async endConsultation(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.consultationsService.endConsultation(id);
    return {
      data,
      message: 'Consultation ended successfully',
    };
  }
}
