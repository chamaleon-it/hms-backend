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
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/schemas/user.schema';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { GetPatientsDto } from './dto/get-patients.dto';
import mongoose from 'mongoose';
import { DeleteBulkPatientDto } from './dto/delete-bulk-patient.dto';
import { UpdateRemarksDto } from './dto/update-remarks.dto';
import { CheckPatientAlreadyExistsDto } from './dto/check-patient-already-exists.dto';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) { }

  @Roles(...[UserRole.RECEPTION, UserRole.PHARMACY, UserRole.DOCTOR, UserRole.LAB])

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

  @Roles(...[UserRole.ADMIN, UserRole.RECEPTION, UserRole.PHARMACY, UserRole.DOCTOR, UserRole.LAB])

  @Get()
  async getPatient(@Query() getPatientsDto: GetPatientsDto) {
    const { data, total } =
      await this.patientsService.getPatient(getPatientsDto);
    return {
      data,
      total,
      message: 'All Patient data are retrieved successfully',
    };
  }

  @Roles(...[UserRole.ADMIN, UserRole.RECEPTION, UserRole.PHARMACY, UserRole.DOCTOR, UserRole.LAB])

  @Get('single/:id')
  async getSinglePatient(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.patientsService.getSinglePatient(id);
    return {
      data,
      message: 'Patient data retrieved successfully',
    };
  }

  @Roles(...[UserRole.ADMIN, UserRole.RECEPTION, UserRole.PHARMACY, UserRole.DOCTOR, UserRole.LAB])

  @Get('unique-locations')
  async getUniqueLocations(
    @Query('field') field: string,
    @Query('q') q: string,
  ) {
    const data = await this.patientsService.getUniqueLocations(field, q);
    return {
      data,
      message: 'Unique locations retrieved successfully',
    };
  }

  @Roles(...[UserRole.ADMIN, UserRole.RECEPTION, UserRole.PHARMACY, UserRole.DOCTOR, UserRole.LAB])

  @Get('statistics')
  async statistics() {
    const data = await this.patientsService.statistics();
    return {
      data,
      message: 'Patient statistics retrieved successfully',
    };
  }

  @Roles(...[UserRole.RECEPTION, UserRole.PHARMACY, UserRole.DOCTOR, UserRole.LAB])

  @Delete()
  async deleteBulkPatient(@Body() deleteBulkPatientDto: DeleteBulkPatientDto) {
    const data =
      await this.patientsService.deleteBulkPatient(deleteBulkPatientDto);
    return {
      data,
      message: 'Selected patients were deleted successfully',
    };
  }

  @Roles(...[UserRole.RECEPTION, UserRole.PHARMACY, UserRole.DOCTOR, UserRole.LAB])

  @Delete(':id')
  async deletePatient(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.patientsService.deletePatient(id);
    return {
      data,
      message: 'Patient is deleted successfully',
    };
  }

  @Roles(...[UserRole.RECEPTION, UserRole.PHARMACY, UserRole.DOCTOR, UserRole.LAB])

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

  @Roles(...[UserRole.RECEPTION, UserRole.PHARMACY, UserRole.DOCTOR, UserRole.LAB])

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

  @Roles(...[UserRole.RECEPTION, UserRole.PHARMACY, UserRole.DOCTOR, UserRole.LAB])

  @Patch('document/:id')
  async uploadPatientDocument(
    @Param('id') id: mongoose.Types.ObjectId,
    @Body() dto: { name: string; url: string; originalName?: string },
  ) {
    const data = await this.patientsService.uploadPatientDocument(id, dto);
    return {
      data,
      message: 'Patient document updated successfully',
    };
  }

  @Roles(...[UserRole.ADMIN, UserRole.RECEPTION, UserRole.PHARMACY, UserRole.DOCTOR, UserRole.LAB])

  @Get('patient_already_exists')
  async checkPatientAlreadyExists(
    @Query() checkPatientAlreadyExistsDto: CheckPatientAlreadyExistsDto,
  ) {
    const data = await this.patientsService.checkPatientAlreadyExists(
      checkPatientAlreadyExistsDto,
    );
    return {
      data: {
        isPatientAlreadyExists: Boolean(data),
        patient: data,
      },
      message: data ? 'Patient already exists' : 'Patient does not exist',
    };
  }
}
