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
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('employee')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) { }

  @Post()
  async create(@Body() dto: CreateEmployeeDto) {
    const data = await this.employeeService.create(dto);
    return { message: 'Employee created successfully', data };
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
  ) {
    const data = await this.employeeService.findAll(search, status, role);
    return { message: 'Employees retrieved successfully', data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.employeeService.findOne(id);
    return { message: 'Employee retrieved successfully', data };
  }

  @Patch('incharge/:id')
  async updateInCharge(@Param('id') id: string) {
    const data = await this.employeeService.updateInCharge(id);
    return { message: 'Employee marked as in-charge successfully', data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    const data = await this.employeeService.update(id, dto);
    return { message: 'Employee updated successfully', data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.employeeService.softDelete(id);
    return { message: 'Employee deleted successfully', data };
  }
}
