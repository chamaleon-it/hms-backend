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
import { ProcedureService } from './procedure.service';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';
import { SubProcedureDto } from './dto/sub-procedure.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('procedure')
@UseGuards(JwtAuthGuard)
export class ProcedureController {
  constructor(private readonly procedureService: ProcedureService) { }

  @Post()
  async create(@Body() dto: CreateProcedureDto): Promise<any> {
    const data = await this.procedureService.createProcedure(dto);
    return {
      message: 'Procedure created successfully',
      data,
    };
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
  ): Promise<any> {
    const data = await this.procedureService.findAll(search, status);
    return {
      message: 'Procedures retrieved successfully',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<any> {
    const data = await this.procedureService.findOne(id);
    return {
      message: 'Procedure retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProcedureDto,
  ): Promise<any> {
    const data = await this.procedureService.updateProcedure(id, dto);
    return {
      message: 'Procedure updated successfully',
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<any> {
    const data = await this.procedureService.softDeleteProcedure(id);
    return {
      message: 'Procedure deleted successfully',
      data,
    };
  }

  @Post(':id/sub-procedure')
  async addSubProcedure(
    @Param('id') id: string,
    @Body() dto: SubProcedureDto,
  ): Promise<any> {
    const data = await this.procedureService.addSubProcedure(id, dto);
    return {
      message: 'Sub-procedure added successfully',
      data,
    };
  }

  @Patch(':id/sub-procedure/:subId')
  async updateSubProcedure(
    @Param('id') id: string,
    @Param('subId') subId: string,
    @Body() dto: Partial<SubProcedureDto>,
  ): Promise<any> {
    const data = await this.procedureService.updateSubProcedure(
      id,
      subId,
      dto,
    );
    return {
      message: 'Sub-procedure updated successfully',
      data,
    };
  }

  @Delete(':id/sub-procedure/:subId')
  async removeSubProcedure(
    @Param('id') id: string,
    @Param('subId') subId: string,
  ): Promise<any> {
    const data = await this.procedureService.softDeleteSubProcedure(id, subId);
    return {
      message: 'Sub-procedure deleted successfully',
      data,
    };
  }
}
