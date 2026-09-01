import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { ResultDto } from './dto/result.dto';
import mongoose from 'mongoose';
import { SampleCollectedDto } from './dto/sample-collected.dto';
import { GetReportDto } from './dto/get-report.dto';
import { LisResultDto } from './dto/lis-result.dto';

@Controller('lab/report')
export class ReportController {
  constructor(private readonly reportService: ReportService) { }
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
      message: 'All Lab report retrieved successfully.',
    };
  }

  @Post('sample_collected/:id')
  @UseGuards(JwtAuthGuard)
  async sampleCollected(
    @Param('id') id: mongoose.Types.ObjectId,
    @Body() dto: SampleCollectedDto,
  ) {
    const data = await this.reportService.sampleCollected(id, dto);
    return {
      message: 'Sample is collected',
      data,
    };
  }

  @Post('start_test/:id')
  @UseGuards(JwtAuthGuard)
  async startTest(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.reportService.startTest(id);
    return {
      message: 'Test is started',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteReport(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.reportService.deleteReport(id);
    return {
      message: 'Report is deleted',
      data,
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

  @Post('lis-result')
  // No JwtAuthGuard here to allow local scripts to call it automatically
  async receiveLisResult(@Body() dto: LisResultDto) {
    const data = await this.reportService.updateFromLis(dto);
    return {
      message: 'LIS Result Received',
      data,
    };
  }

  @Get(`patient/:id`)
  @UseGuards(JwtAuthGuard)
  async getPatientReports(@Param('id') patient: mongoose.Types.ObjectId) {
    const data = await this.reportService.getPatientReports(patient);
    return {
      message: 'patient lab report is fetched',
      data,
    };
  }

  @Get('patients')
  @UseGuards(JwtAuthGuard)
  async getPatients(@Query() query: any) {
    const { data, total } = await this.reportService.getPatients(query);
    return {
      data,
      total,
      message: 'All patient data retrieved',
    };
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  async getStatistics() {
    const data = await this.reportService.getStatistics();
    return {
      data,
      message: 'All statistics retrieved',
    };
  }

  @Post('mark_as_flagged/:id')
  @UseGuards(JwtAuthGuard)
  async markAsFlagged(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.reportService.markAsFlagged(id);
    return {
      message: 'Report is marked as flagged',
      data,
    };
  }
  @Post('mark_as_unflagged/:id')
  @UseGuards(JwtAuthGuard)
  async markAsUnflagged(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.reportService.markAsUnflagged(id);
    return {
      message: 'Report is marked as unflagged',
      data,
    };
  }

  @Post('reset_timer/:id')
  @UseGuards(JwtAuthGuard)
  async resetTimer(
    @Param('id') id: mongoose.Types.ObjectId,
    @Body() dto: { duration: number },
  ) {
    const data = await this.reportService.resetTimer(id, dto);
    return {
      message: 'Timer is reset',
      data,
    };
  }

  @Post('recover/:id')
  @UseGuards(JwtAuthGuard)
  async recoverReport(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.reportService.recoverReport(id);
    return {
      message: 'Report is recovered',
      data,
    };
  }

  @Post('repeat/:id')
  @UseGuards(JwtAuthGuard)
  async repeatReport(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.reportService.repeatReport(id);
    return {
      message: 'Report is repeated',
      data,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateReport(
    @Param('id') id: mongoose.Types.ObjectId,
    @Body() dto: CreateReportDto,
  ) {
    const data = await this.reportService.updateReport(id, dto);
    return {
      message: 'Report is updated successfully',
      data,
    };
  }
}
