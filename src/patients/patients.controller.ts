import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientRegisterDto } from './dto/patient-register.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { GetPatientsDto } from './dto/get-patients.dto';
import mongoose from 'mongoose';
import { DeleteBulkPatientDto } from './dto/delete-bulk-patient.dto';
import { UpdateRemarksDto } from './dto/update-remarks.dto';
import { CheckPatientAlreadyExistsDto } from './dto/check-patient-already-exists.dto';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) { }

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

  @Get('single/:id')
  async getSinglePatient(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.patientsService.getSinglePatient(id);
    return {
      data,
      message: 'Patient data retrived successfully',
    };
  }

  @Get('statistics')
  async statistics() {
    const data = await this.patientsService.statistics();
    return {
      data,
      message: 'Patient statistics retrived successfully',
    };
  }

  @Delete()
  async deleteBulkPatient(@Body() deleteBulkPatientDto: DeleteBulkPatientDto) {
    const data =
      await this.patientsService.deleteBulkPatient(deleteBulkPatientDto);
    return {
      data,
      message: 'Selected patients were deleted successfully',
    };
  }

  @Delete(':id')
  async deletePatient(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.patientsService.deletePatient(id);
    return {
      data,
      message: 'Patient is deleted successfully',
    };
  }

  @Patch('remarks/:id')
  async updatePatientRemarks(
    @Body() updateRemarksDto: UpdateRemarksDto,
    @Param('id') patient: mongoose.Types.ObjectId,
  ) {
    updateRemarksDto.remarksDate = new Date();
    const data = await this.patientsService.updatePatientRemarks(
      updateRemarksDto,
      patient,
    );

    return {
      data,
      message: 'Patient remarks is updated successfully',
    };
  }

  @Patch(':id')
  async updatePatient(
    @Body() patientRegisterDto: PatientRegisterDto,
    @Param('id') patient: mongoose.Types.ObjectId,
  ) {
    const data = await this.patientsService.updatePatient(
      patientRegisterDto,
      patient,
    );

    return {
      data,
      message: 'Patient details is updated successfully',
    };
  }

  @Get("patient_already_exists")
  async checkPatientAlreadyExists(@Query() checkPatientAlreadyExistsDto: CheckPatientAlreadyExistsDto) {
    const data = await this.patientsService.checkPatientAlreadyExists(checkPatientAlreadyExistsDto);
    return {
      data: {
        isPatientAlreadyExists: Boolean(data),
        patient: data,
      },
      message: data ? 'Patient already exists' : 'Patient does not exist',
    };
  }
}
