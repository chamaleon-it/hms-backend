import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TechnicianService } from './technician.service';
import { RegisterTechnicianDto } from './dto/register-technician.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/schemas/user.schema';

@Controller('technician')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LAB, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class TechnicianController {
  constructor(private readonly technicianService: TechnicianService) {}

  @Post('register')
  async registerTechnician(
    @Body() registerTechnicianDto: RegisterTechnicianDto,
  ) {
    return {
      data: await this.technicianService.registerTechnician(
        registerTechnicianDto,
      ),
      message: 'Pharmacist registered successfully',
    };
  }

  @Get()
  async getAllTechnicians() {
    return {
      data: await this.technicianService.getAllTechnicians(),
      message: 'Technicians fetched successfully',
    };
  }

  @Delete(':id')
  async deleteTechnician(@Param('id') id: string) {
    return {
      data: await this.technicianService.deleteTechnician(id),
      message: 'Technician deleted successfully',
    };
  }

  @Patch('incharge/:id')
  async updateInCharge(@Param('id') id: string) {
    return {
      data: await this.technicianService.updateInCharge(id),
      message: 'Technician updated successfully',
    };
  }

  @Patch(':id')
  async updateTechnician(
    @Param('id') id: string,
    @Body() updateTechnicianDto: RegisterTechnicianDto,
  ) {
    return {
      data: await this.technicianService.updateTechnician(
        id,
        updateTechnicianDto,
      ),
      message: 'Pharmacist updated successfully',
    };
  }
}
