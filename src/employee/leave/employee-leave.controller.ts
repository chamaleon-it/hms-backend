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
import { EmployeeLeaveService } from './employee-leave.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto, UpdateLeaveStatusDto } from './dto/update-leave.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('employee-leave')
@UseGuards(JwtAuthGuard)
export class EmployeeLeaveController {
  constructor(private readonly leaveService: EmployeeLeaveService) { }

  @Post()
  async create(@Body() createLeaveDto: CreateLeaveDto) {
    const data = await this.leaveService.create(createLeaveDto);
    return { message: 'Leave application submitted successfully', data };
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
    @Query('role') role?: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    const data = await this.leaveService.findAll(
      search,
      status,
      employeeId,
      role,
      month,
      year,
    );
    return { message: 'Leave records retrieved successfully', data };
  }

  @Get('stats')
  async getStats(
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    const data = await this.leaveService.getStats(year, month);
    return { message: 'Leave stats retrieved successfully', data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.leaveService.findOne(id);
    return { message: 'Leave record retrieved successfully', data };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveStatusDto,
  ) {
    const data = await this.leaveService.updateStatus(id, dto);
    return { message: `Leave status updated to ${dto.status}`, data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLeaveDto: UpdateLeaveDto,
  ) {
    const data = await this.leaveService.update(id, updateLeaveDto);
    return { message: 'Leave record updated successfully', data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.leaveService.softDelete(id);
    return { message: 'Leave record deleted successfully', data };
  }
}
