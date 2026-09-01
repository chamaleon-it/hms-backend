import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PurchaseEntryService } from './purchase_entry.service';
import { CreatePurchaseEntryDto } from './dto/create-purchase-entry.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('purchase_entry')
@UseGuards(JwtAuthGuard)
export class PurchaseEntryController {
  constructor(private readonly purchaseEntryService: PurchaseEntryService) { }

  @Post()
  async create(@Body() createPurchaseEntryDto: CreatePurchaseEntryDto) {
    return {
      data: await this.purchaseEntryService.create(createPurchaseEntryDto),
      message: 'Purchase Entry Created Successfully',
    };
  }

  @Get('/supplier/:id')
  async findAll(@Param('id') id: string) {
    return {
      data: await this.purchaseEntryService.findBySupplier(id),
      message: 'Purchase Entry Found Successfully',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return {
      data: await this.purchaseEntryService.findById(id),
      message: 'Purchase Entry Found Successfully',
    };
  }

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
