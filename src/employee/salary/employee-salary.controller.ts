import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { EmployeeSalaryService } from './employee-salary.service';
import {
  CreateSalaryDto,
  GenerateBatchPayrollDto,
} from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { PaySalaryDto } from './dto/pay-salary.dto';

@Controller('employee-salary')
export class EmployeeSalaryController {
  constructor(private readonly salaryService: EmployeeSalaryService) {}

  @Post()
  async create(@Body() createSalaryDto: CreateSalaryDto) {
    const data = await this.salaryService.create(createSalaryDto);
    return { message: 'Salary slip created successfully', data };
  }

  @Post('generate-batch')
  async generateBatch(@Body() dto: GenerateBatchPayrollDto) {
    const data = await this.salaryService.generateBatch(dto);
    return { message: data.message, data };
  }

  @Get()
  async findAll(
    @Query('month') month?: string,
    @Query('year') year?: number,
    @Query('employeeId') employeeId?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.salaryService.findAll(
      month,
      year,
      employeeId,
      role,
      status,
      search,
    );
    return { message: 'Salary records retrieved successfully', data };
  }

  @Get('unpaid-leaves')
  async getUnpaidLeaves(
    @Query('employeeId') employeeId: string,
    @Query('month') month: string,
    @Query('year') year: number,
  ) {
    const days = await this.salaryService.getApprovedUnpaidLeaveDays(
      employeeId,
      month,
      Number(year) || new Date().getFullYear(),
    );
    return { data: { unpaidLeaves: days } };
  }

  @Get('stats')
  async getStats(
    @Query('month') month?: string,
    @Query('year') year?: number,
  ) {
    const data = await this.salaryService.getStats(month, year);
    return { message: 'Salary stats retrieved successfully', data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.salaryService.findOne(id);
    return { message: 'Salary record retrieved successfully', data };
  }

  @Patch(':id/pay')
  async paySalary(
    @Param('id') id: string,
    @Body() paySalaryDto: PaySalaryDto,
  ) {
    const data = await this.salaryService.paySalary(id, paySalaryDto);
    return { message: 'Salary payout processed successfully', data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSalaryDto: UpdateSalaryDto,
  ) {
    const data = await this.salaryService.update(id, updateSalaryDto);
    return { message: 'Salary record updated successfully', data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.salaryService.softDelete(id);
    return { message: 'Salary record deleted successfully', data };
  }
}
