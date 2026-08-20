import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TreatmentService } from './treatment.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { ProcessTreatmentDto } from './dto/process-treatment.dto';
import { RepeatTreatmentDto } from './dto/repeat-treatment.dto';
import { GetTreatmentsDto } from './dto/get-treatments.dto';

@UseGuards(JwtAuthGuard)
@Controller('treatment')
export class TreatmentController {
  constructor(private readonly treatmentService: TreatmentService) {}

  @Post()
  async create(@Body() createTreatmentDto: CreateTreatmentDto) {
    const data = await this.treatmentService.create(createTreatmentDto);
    return {
      message: 'Treatment order created successfully',
      data,
    };
  }

  @Get()
  async findAll(@Query() query: GetTreatmentsDto) {
    return await this.treatmentService.findAll(query);
  }

  @Get(':id/timeline')
  async getTimeline(@Param('id') id: string) {
    const data = await this.treatmentService.getTimeline(id);
    return {
      message: 'Treatment timeline retrieved successfully',
      data,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.treatmentService.findOne(id);
    return {
      message: 'Treatment details retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTreatmentDto: UpdateTreatmentDto,
  ) {
    const data = await this.treatmentService.update(id, updateTreatmentDto);
    return {
      message: 'Treatment updated successfully',
      data,
    };
  }

  @Post(':id/process')
  async processSession(
    @Param('id') id: string,
    @Body() processDto: ProcessTreatmentDto,
    @Req() req: any,
  ) {
    const userId = req?.user?._id || req?.user?.id;
    const result = await this.treatmentService.processSession(
      id,
      processDto,
      userId,
    );
    return {
      message: 'Treatment session processed and billed successfully',
      data: result.treatment,
      bill: result.bill,
    };
  }

  @Post(':id/repeat')
  async repeatSession(
    @Param('id') id: string,
    @Body() repeatDto: RepeatTreatmentDto,
    @Req() req: any,
  ) {
    const userId = req?.user?._id || req?.user?.id;
    const result = await this.treatmentService.repeatSession(
      id,
      repeatDto,
      userId,
    );
    return {
      message: 'Treatment session repeated successfully',
      data: result.treatment,
      bill: result.bill,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.treatmentService.delete(id);
  }
}
