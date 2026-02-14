import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PharmacistService } from './pharmacist.service';
import { RegisterPharmacistDto } from './dto/register-pharmacist.dto';

@Controller('pharmacist')
export class PharmacistController {
  constructor(private readonly pharmacistService: PharmacistService) { }

  @Post('register')
  async registerPharmacist(@Body() registerPharmacistDto: RegisterPharmacistDto) {
    return {
      data: await this.pharmacistService.registerPharmacist(registerPharmacistDto),
      message: "Pharmacist registered successfully"
    };
  }

  @Get()
  async getAllPharmacists() {
    return {
      data: await this.pharmacistService.getAllPharmacists(),
      message: "Pharmacists fetched successfully"
    };
  }

  @Delete(':id')
  async deletePharmacist(@Param('id') id: string) {
    return {
      data: await this.pharmacistService.deletePharmacist(id),
      message: "Pharmacist deleted successfully"
    };
  }

  @Patch(':id')
  async updatePharmacist(@Param('id') id: string, @Body() updatePharmacistDto: RegisterPharmacistDto) {
    return {
      data: await this.pharmacistService.updatePharmacist(id, updatePharmacistDto),
      message: "Pharmacist updated successfully"
    };
  }
}
