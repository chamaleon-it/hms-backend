import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PurchaseEntryService } from './purchase_entry.service';
import { CreatePurchaseEntryDto } from './dto/create-purchase-entry.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/schemas/user.schema';

@Controller('purchase_entry')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchaseEntryController {
  constructor(private readonly purchaseEntryService: PurchaseEntryService) { }

  @Roles(...[UserRole.PHARMACY, UserRole.PHARMACY_WHOLESALER])

  @Post()
  async create(@Body() createPurchaseEntryDto: CreatePurchaseEntryDto) {
    return {
      data: await this.purchaseEntryService.create(createPurchaseEntryDto),
      message: 'Purchase Entry Created Successfully',
    };
  }

  @Roles(...[UserRole.ADMIN, UserRole.PHARMACY, UserRole.PHARMACY_WHOLESALER])

  @Get('/supplier/:id')
  async findAll(@Param('id') id: string) {
    return {
      data: await this.purchaseEntryService.findBySupplier(id),
      message: 'Purchase Entry Found Successfully',
    };
  }

  @Roles(...[UserRole.ADMIN, UserRole.PHARMACY, UserRole.PHARMACY_WHOLESALER])

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return {
      data: await this.purchaseEntryService.findById(id),
      message: 'Purchase Entry Found Successfully',
    };
  }

  @Roles(...[UserRole.PHARMACY, UserRole.PHARMACY_WHOLESALER])

  @Patch('add_payment/:id')
  async addPayment(
    @Param('id') id: string,
    @Body() addPaymentDto: AddPaymentDto,
  ) {
    return {
      data: await this.purchaseEntryService.addPayment(id, addPaymentDto),
      message: 'Payment Added Successfully',
    };
  }
}
