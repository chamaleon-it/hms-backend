import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { CreateMedicalCertificateDto } from './dto/create-medical-certificate.dto';
import { GetMedicalCertificatesDto } from './dto/get-medical-certificates.dto';
import { MedicalCertificateService } from './medical-certificate.service';

@Controller('pharmacy/medical-certificate')
@UseGuards(JwtAuthGuard)
export class MedicalCertificateController {
  constructor(
    private readonly medicalCertificateService: MedicalCertificateService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateMedicalCertificateDto,
    @GetUser() user: JWTUserInterface,
  ) {
    const data = await this.medicalCertificateService.create(dto, user?.id);
    return {
      message: 'Medical certificate saved.',
      data,
    };
  }

  @Get()
  async findAll(@Query() query: GetMedicalCertificatesDto) {
    const result = await this.medicalCertificateService.findAll(query);
    return {
      message: 'Medical certificates retrieved successfully.',
      ...result,
    };
  }
}
