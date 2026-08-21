import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { RegisterSupplierDto } from './dto/register-supplier.dto';
import { UpdateSupplierDto } from './dto/update-suppllier.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/schemas/user.schema';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) { }

  @Roles(...[UserRole.PHARMACY, UserRole.PHARMACY_WHOLESALER])

  @Post()
  async registerSupplier(@Body() dto: RegisterSupplierDto) {
    return {
      message: 'Supplier registered successfully',
      data: await this.suppliersService.registerSupplier(dto),
    };
  }

  @Roles(...[UserRole.ADMIN, UserRole.PHARMACY, UserRole.PHARMACY_WHOLESALER])

  @Get()
  async findAll() {
    return {
      message: 'All suppliers were retrieved successfully',
      data: await this.suppliersService.findAll(),
    };
  }

  @Roles(...[UserRole.ADMIN, UserRole.PHARMACY, UserRole.PHARMACY_WHOLESALER])

  @Get('get_id_and_name')
  async getIdAndName() {
    return {
      message: 'Supplier id was retrieved successfully',
      data: await this.suppliersService.getIdAndName(),
    };
  }

  @Roles(...[UserRole.ADMIN, UserRole.PHARMACY, UserRole.PHARMACY_WHOLESALER])

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return {
      message: 'Supplier was retrieved successfully',
      data: await this.suppliersService.findOne(id),
    };
  }

  @Roles(...[UserRole.PHARMACY, UserRole.PHARMACY_WHOLESALER])

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
}
