import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { BillingService } from '../billing/billing.service';
import { GetBillisDto } from '../billing/dto/get-bills.dto';
import { Query } from '@nestjs/common';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly billingService: BillingService
  ) {}

  @Get('billing')
  async getAllBills(@Query() getBillisDto: GetBillisDto) {
    const { data, total } = await this.billingService.getBills(null, getBillisDto);
    return {
      message: 'All bills retrieved successfully.',
      data,
      total,
      page: Number(getBillisDto.page),
      limit: Number(getBillisDto.limit),
    };
  }

  @Get('dashboard/stats')
  async getDashboardStats() {
    const data = await this.adminService.getDashboardStats();
    return { message: 'Dashboard stats retrieved', data };
  }

  @Get('dashboard/analytics')
  async getDashboardAnalytics(@Query('range') range: string) {
    const data = await this.adminService.getDashboardAnalytics(range);
    return { message: 'Dashboard analytics retrieved', data };
  }

  @Get('users')
  async getAllUsers() {
    const data = await this.adminService.getAllUsers();
    return { message: 'All users retrieved', data };
  }

  @Get('doctors')
  async getAllDoctors() {
    const data = await this.adminService.getUsersByRole(UserRole.DOCTOR);
    return { message: 'Doctors retrieved', data };
  }

  @Get('staff')
  async getAllStaff() {
    const data = await this.adminService.getAllStaff();
    return { message: 'Staff retrieved', data };
  }
}
