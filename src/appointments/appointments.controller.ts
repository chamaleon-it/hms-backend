import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { GetListDto } from './dto/get-list.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async getAppointments(@Query() getListDto: GetListDto) {
    const data = await this.appointmentsService.getAppointments({query:getListDto.query,status:getListDto.status ? JSON.parse(getListDto.status as string) : []});
    return {
      data,
      message: 'Appointment retrived successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('statistics')
  async getStatistics() {
    const data = await this.appointmentsService.getStatistics();
    return {
      data,
      message: 'Appointment statistics retrived successfully',
    };
  }

  @Get("calender-monthly")
  async calenderMonthly(){
    const data = await this.appointmentsService.calenderMonthly()
    return {
      data,
      message:"Monthly calender fetched successfully"
    }
  }
}
