import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConsultingsService } from './consultings.service';
import { ConsultingDto } from './dto/consulting.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('consultings')
@UseGuards(JwtAuthGuard)
export class ConsultingsController {
  constructor(private readonly consultingsService: ConsultingsService) { }

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

  @Get('/patient/:patientId')
  async getPatientConsultings(@Param('patientId') patientId: string) {
    const data = await this.consultingsService.getPatientConsultings(patientId);
    return {
      message: 'Patient consultation record retrieved',
      data,
    };
  }

  @Patch('/:id/therapy-status')
  async updateTherapyStatus(
    @Param('id') id: string,
    @Body('completed') completed?: boolean,
  ) {
    const data = await this.consultingsService.updateTherapyStatus(
      id,
      completed ?? true,
    );
    return {
      message: 'Therapy status updated successfully',
      data,
    };
  }

  @Patch('/:id/procedure-status')
  async updateProcedureStatus(
    @Param('id') id: string,
    @Body('completed') completed?: boolean,
  ) {
    const data = await this.consultingsService.updateProcedureStatus(
      id,
      completed ?? true,
    );
    return {
      message: 'Procedure status updated successfully',
      data,
    };
  }
}
