import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientRegisterDto } from './dto/patient-register.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { GetPatientsDto } from './dto/get-patients.dto';
import mongoose from 'mongoose';

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
  async getPatient(@Query() getPatientsDto: GetPatientsDto) {
    const data = await this.patientsService.getPatient(getPatientsDto);
    return {
      data,
      message: 'All Patient data are retrived successfully',
    };
  }

  @Get("single/:id")
  async getSinglePatient(@Param("id") id:mongoose.Types.ObjectId){
    const data = await this.patientsService.getSinglePatient(id)
    return {
      data,
      message:"Patient data retrived successfully"
    }
  }

  @Get("statistics")
  async statistics(){
    const data = await this.patientsService.statistics()
    return {
      data,
      message:"Patient statistics retrived successfully"
    }
  }
}
