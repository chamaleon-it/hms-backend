import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InPatientsService } from './in-patients.service';
import { CreateInPatientDto } from './dto/create-in-patient.dto';
import { UpdateInPatientDto } from './dto/update-in-patient.dto';
import { JwtAuthGuard } from '../auth/auth.guard';

@Controller('in-patients')
@UseGuards(JwtAuthGuard)
export class InPatientsController {
  constructor(private readonly inPatientsService: InPatientsService) {}

  @Post()
  create(@Body() createInPatientDto: CreateInPatientDto, @Req() req: any) {
    return this.inPatientsService.create(createInPatientDto, req.user);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.inPatientsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inPatientsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInPatientDto: UpdateInPatientDto,
    @Req() req: any,
  ) {
    return this.inPatientsService.update(id, updateInPatientDto, req.user);
  }

  @Post(':id/notes')
  addNote(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.inPatientsService.addIpNote(id, body, req.user);
  }


  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inPatientsService.remove(id);
  }
}
