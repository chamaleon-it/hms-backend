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
import { SuppliersService } from './suppliers.service';
import { RegisterSupplierDto } from './dto/register-supplier.dto';
import { UpdateSupplierDto } from './dto/update-suppllier.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/schemas/user.schema';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PHARMACY, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  async registerSupplier(@Body() dto: RegisterSupplierDto) {
    return {
      message: 'Supplier registered successfully',
      data: await this.suppliersService.registerSupplier(dto),
    };
  }

  @Get()
  async findAll() {
    return {
      message: 'All suppliers were retrived successfully',
      data: await this.suppliersService.findAll(),
    };
  }

  @Get('get_id_and_name')
  async getIdAndName(@Query('includeInactive') includeInactive?: string) {
    return {
      message: 'Supplier id was retrived successfully',
      data: await this.suppliersService.getIdAndName(
        includeInactive !== 'true',
      ),
    };
  }

  @Get(':id/dependencies')
  async getDependencies(@Param('id') id: string) {
    return {
      message: 'Supplier dependency summary retrieved',
      data: await this.suppliersService.getDependencySummary(id),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return {
      message: 'Supplier was retrived successfully',
      data: await this.suppliersService.findOne(id),
    };
  }

  @Patch(':id')
  async updateSupplier(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return {
      message: 'Supplier updated successfully',
      data: await this.suppliersService.updateSupplier(id, dto),
    };
  }

  @Delete(':id')
  async deleteSupplier(
    @Param('id') id: string,
    @Query('mode') mode?: 'soft' | 'hard' | 'auto',
  ) {
    return {
      message: 'Supplier delete/deactivate completed',
      data: await this.suppliersService.deleteOrDeactivate(id, mode || 'auto'),
    };
  }
}
