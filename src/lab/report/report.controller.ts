import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';

@Controller('lab/report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}
  @Post()
  async createReport(@Body() dto: CreateReportDto) {
    const data = await this.reportService.createReport(dto);
    return {
      message: 'Report is created successfully',
      data,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getReport(@GetUser() user: JWTUserInterface) {
   const data = await this.reportService.getReport(user.id) 
   return {
    data,
    message:"All Lab report retrived successfully."
   }
  }
}
