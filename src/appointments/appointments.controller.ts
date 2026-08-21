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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { GetListDto } from './dto/get-list.dto';
import mongoose from 'mongoose';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Post()
  async createAppointment(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @GetUser() user: JWTUserInterface,
  ) {
    const data = await this.appointmentsService.createAppointment(
      createAppointmentDto,
      user.id,
    );
    return {
      data,
      message: 'Appointment created successfully.',
    };
  }

  @Get('list')
  async getAppointments(
    @Query() getListDto: GetListDto,
    @GetUser() user: JWTUserInterface,
  ) {
    const doctorFilter =
      getListDto.doctor ||
      (user.role === 'Doctor' ? user.id?.toString() : undefined);
    const data = await this.appointmentsService.getAppointments({
      query: getListDto.query,
      status: getListDto.status ? getListDto.status : [],
      date: getListDto.date || new Date().toString(),
      activeDate: getListDto.activeDate,
      doctor: doctorFilter,
    });
    return {
      data,
      message: 'Appointment retrieved successfully',
    };
  }

  @Get('single/:id')
  async getSingleAppointment(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.appointmentsService.getSingleAppointment(id);
    return {
      data,
      message: 'Single appointment is retrieved.',
    };
  }

  @Get('statistics')
  async getStatistics(
    @GetUser() user: JWTUserInterface,
    @Query('doctor') doctor?: string,
  ) {
    const doctorFilter =
      doctor || (user.role === 'Doctor' ? user.id?.toString() : undefined);
    const data = await this.appointmentsService.getStatistics(doctorFilter);
    return {
      data,
      message: 'Appointment statistics retrieved successfully',
    };
  }

  @Get('calender-monthly')
  async calenderMonthly(
    @GetUser() user: JWTUserInterface,
    @Query('date') date?: string,
    @Query('doctor') doctor?: string,
  ) {
    const doctorFilter =
      doctor || (user.role === 'Doctor' ? user.id?.toString() : undefined);
    const data = await this.appointmentsService.calenderMonthly(
      date || new Date().toString(),
      doctorFilter,
    );
    return {
      data,
      message: 'Monthly calender fetched successfully',
    };
  }

  @Get('/calender/weekly')
  async calenderWeekly(
    @GetUser() user: JWTUserInterface,
    @Query('date') date?: string,
    @Query('startOfWeek') startOfWeek?: string,
    @Query('doctor') doctor?: string,
  ) {
    const doctorFilter =
      doctor || (user.role === 'Doctor' ? user.id?.toString() : undefined);
    const queryDate = date || startOfWeek || new Date().toString();
    const data = await this.appointmentsService.calenderWeekly(
      queryDate,
      doctorFilter,
    );
    return {
      message: 'Weekly calander fetched',
      data,
    };
  }

  @Patch('update_status/:id')
  async updateStatus(
    @Param('id') id: mongoose.Types.ObjectId,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    const data = await this.appointmentsService.updateStatus(
      id,
      updateStatusDto,
    );
    return {
      data,
      message: 'Appointment status is updated',
    };
  }

  @Get('booked_slot')
  async getBookedSlot(
    @Query('date') date?: string,
    @Query('doctor') doctor?: mongoose.Types.ObjectId,
  ) {
    const selectedDate = date ? new Date(date) : new Date();
    const data = await this.appointmentsService.getBookedSlot(
      selectedDate,
      doctor,
    );
    return {
      data,
      message: 'Booked slot all retrieved successfully',
    };
  }

  @Get('patient/:id')
  async getPatientAppointment(@Param('id') patient: mongoose.Types.ObjectId) {
    const data = await this.appointmentsService.getPatientAppointment(patient);
    return {
      data,
      message: 'patient appointment are retrieved successfully',
    };
  }

  @Get('walk-in/:doctor')
  async getWalkInAppointment(
    @Param('doctor') doctor: mongoose.Types.ObjectId,
    @Query('date') date: string,
  ) {
    const data = await this.appointmentsService.getWalkInAppointment(
      doctor,
      date,
    );
    return {
      data,
      message: 'walk-in appointment',
    };
  }

  @Patch(':id')
  async updateAppointment(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Param('id') id: mongoose.Types.ObjectId,
  ) {
    const data = await this.appointmentsService.updateAppointment(
      createAppointmentDto,
      id,
    );
    return {
      data,
      message: 'Appointment updated successfully.',
    };
  }

  @Delete(':id')
  async deleteAppointment(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.appointmentsService.deleteAppointment(id);
    return {
      data,
      message: 'Appointment deleted successfully.',
    };
  }

  @Post('recover/:id')
  async recoverAppointment(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.appointmentsService.recoverAppointment(id);
    return {
      data,
      message: 'Appointment recovered successfully.',
    };
  }

  @Post('refund/:id')
  async refundAppointment(
    @Param('id') id: mongoose.Types.ObjectId,
    @GetUser() user: JWTUserInterface,
    @Body() body: { reason?: string },
  ) {
    const data = await this.appointmentsService.refundAppointment(
      id,
      new mongoose.Types.ObjectId(user.id),
      body.reason,
    );
    return {
      data,
      message: 'Appointment refunded successfully.',
    };
  }

  @Patch('arrived/:id')
  async markArrived(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.appointmentsService.markArrived(id);
    return {
      data,
      message: 'Patient marked as arrived successfully.',
    };
  }
}
