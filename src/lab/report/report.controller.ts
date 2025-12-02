import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { GetReportDto } from './dto/get-report.dto';
import { ResultDto } from './dto/result.dto';
import mongoose from 'mongoose';

@Controller('lab/report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}
  @Post()
  @UseGuards(JwtAuthGuard)
  async createReport(@Body() dto: CreateReportDto) {
    const data = await this.reportService.createReport(dto);
    return {
      message: 'Test is created successfully',
      data,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getReport(
    @GetUser() user: JWTUserInterface,
    @Query() dto: GetReportDto,
  ) {
    const data = await this.reportService.getReport(user.id, dto);
    return {
      data,
      message: 'All Lab report retrived successfully.',
    };
  }

  @Post('result')
  @UseGuards(JwtAuthGuard)
  async updateResult(@Body() dto: ResultDto) {
    const data = await this.reportService.updateResult(dto);
    return {
      message: 'Result updated.  ',
      data,
    };
  }

  @Get(`patient/:id`)
  async getPatientReports(@Param('id') patient: mongoose.Types.ObjectId) {
    const data = await this.reportService.getPatientReports(patient);
    return {
      message: 'patient lab report is fetched',
      data,
    };
  }
}
