import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ConsultingsService } from './consultings.service';
import { ConsultingDto } from './dto/consulting.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('consultings')
export class ConsultingsController {
  constructor(private readonly consultingsService: ConsultingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() consultingDto: ConsultingDto,
    @GetUser() user: JWTUserInterface,
  ) {
    const data = await this.consultingsService.create(consultingDto, user.id);
    return {
      data,
      message: 'Consulting has been recorded successfully.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('/patient/:id')
  async getPatientConsultings(@Param('id') patientId: string) {
    const data = await this.consultingsService.getPatientConsultings(patientId);
    return {
      message: 'Patient consultation record retrived',
      data,
    };
  }
}
