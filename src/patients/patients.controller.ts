import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientRegisterDto } from './dto/patient-register.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async register(
    @Body() patientRegisterDto: PatientRegisterDto,
    @GetUser() user: JWTUserInterface,
  ) {
    const data = await this.patientsService.register(
      patientRegisterDto,
      user.id,
    );
    return {
      data,
      message: 'Patient register successfully.',
    };
  }

  @Get()
  async getPatient() {
    const data = await this.patientsService.getPatient();
    return {
      data,
      message: 'All Patient data are retrived successfully',
    };
  }
}
