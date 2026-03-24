import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { RegisterSupplierDto } from './dto/register-supplier.dto';
import { UpdateSupplierDto } from './dto/update-suppllier.dto';

@Controller('suppliers')
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
  async getIdAndName() {
    return {
      message: 'Supplier id was retrived successfully',
      data: await this.suppliersService.getIdAndName(),
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
}
