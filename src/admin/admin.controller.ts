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
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import {
  CreateDoctorDto,
  UpdateDoctorAvailabilityBodyDto,
  UpdateDoctorDto,
} from './dto/doctor.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getDashboardStats() {
    const data = await this.adminService.getDashboardStats();
    return {
      data,
      message: 'Admin stats retrieved successfully',
    };
  }

  @Get('pnl')
  async getProfitAndLoss(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const data = await this.adminService.getProfitAndLoss(startDate, endDate);
    return {
      data,
      message: 'Profit and loss retrieved successfully',
    };
  }

  // --- Doctor Endpoints ---
  @Get('doctors')
  async getDoctors() {
    const data = await this.adminService.getDoctors();
    return {
      data,
      message: 'Doctors retrieved successfully',
    };
  }

  @Get('doctors/:id')
  async getDoctorById(@Param('id') id: string) {
    const data = await this.adminService.getDoctorById(id);
    return {
      data,
      message: 'Doctor retrieved successfully',
    };
  }

  @Post('doctors')
  async createDoctor(@Body() body: CreateDoctorDto) {
    const data = await this.adminService.createDoctor(body);
    return {
      data,
      message: 'Doctor created successfully',
    };
  }

  @Patch('doctors/:id')
  async updateDoctor(@Param('id') id: string, @Body() body: UpdateDoctorDto) {
    const data = await this.adminService.updateDoctor(id, body);
    return {
      data,
      message: 'Doctor updated successfully',
    };
  }

  @Delete('doctors/:id')
  async deleteDoctor(@Param('id') id: string) {
    const data = await this.adminService.deleteDoctor(id);
    return {
      data,
      message: 'Doctor deleted successfully',
    };
  }

  @Patch('doctors/:id/availability')
  async updateDoctorAvailability(
    @Param('id') id: string,
    @Body() body: UpdateDoctorAvailabilityBodyDto,
  ) {
    const data = await this.adminService.updateDoctorAvailability(
      id,
      body?.availability ?? null,
    );
    return {
      data,
      message: 'Doctor consultation schedule updated successfully',
    };
  }

  @Delete('doctors/:id/availability')
  async deleteDoctorAvailability(@Param('id') id: string) {
    const data = await this.adminService.deleteDoctorAvailability(id);
    return {
      data,
      message: 'Doctor consultation schedule cleared',
    };
  }

  @Get('reports/summary')
  async getReportsSummary(
    @Query('mode') mode?: string,
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('billingType') billingType?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('department') department?: string,
  ) {
    const data = await this.adminService.getReportsSummary({
      mode,
      date,
      month,
      billingType,
      paymentStatus,
      department,
    });
    return {
      data,
      message: 'Admin report summary retrieved successfully',
    };
  }

  // --- Unified Billing ---
  @Get('billing')
  async getAdminBilling(
    @Query('department') department?: string,
    @Query('status') status?: string,
    @Query('method') method?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('billingType') billingType?: string,
  ) {
    const data = await this.adminService.getAdminBilling({
      department,
      status,
      method,
      startDate,
      endDate,
      q,
      page,
      limit,
      billingType,
    });
    return {
      data,
      message: 'Admin billing retrieved successfully',
    };
  }
}
