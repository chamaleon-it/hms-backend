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

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getDashboardStats() {
    const data = await this.adminService.getDashboardStats();
    return {
      data,
      message: 'Admin stats retrieved successfully',
    };
  }

  // --- Doctor Endpoints ---
  @Get('doctors')
  @UseGuards(JwtAuthGuard)
  async getDoctors() {
    const data = await this.adminService.getDoctors();
    return {
      data,
      message: 'Doctors retrieved successfully',
    };
  }

  @Get('doctors/:id')
  @UseGuards(JwtAuthGuard)
  async getDoctorById(@Param('id') id: string) {
    const data = await this.adminService.getDoctorById(id);
    return {
      data,
      message: 'Doctor retrieved successfully',
    };
  }

  @Post('doctors')
  @UseGuards(JwtAuthGuard)
  async createDoctor(@Body() body: any) {
    const data = await this.adminService.createDoctor(body);
    return {
      data,
      message: 'Doctor created successfully',
    };
  }

  @Patch('doctors/:id')
  @UseGuards(JwtAuthGuard)
  async updateDoctor(@Param('id') id: string, @Body() body: any) {
    const data = await this.adminService.updateDoctor(id, body);
    return {
      data,
      message: 'Doctor updated successfully',
    };
  }

  @Delete('doctors/:id')
  @UseGuards(JwtAuthGuard)
  async deleteDoctor(@Param('id') id: string) {
    const data = await this.adminService.deleteDoctor(id);
    return {
      data,
      message: 'Doctor deleted successfully',
    };
  }

  // --- Unified Billing ---
  @Get('billing')
  @UseGuards(JwtAuthGuard)
  async getAdminBilling(
    @Query('department') department?: string,
    @Query('status') status?: string,
    @Query('method') method?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
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
    });
    return {
      data,
      message: 'Admin billing retrieved successfully',
    };
  }
}
