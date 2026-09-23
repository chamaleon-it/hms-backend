import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PurchaseEntryService } from './purchase_entry.service';
import { CreatePurchaseEntryDto } from './dto/create-purchase-entry.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { SupplierBulkPaymentDto } from './dto/supplier-bulk-payment.dto';

@Controller('purchase_entry')
export class PurchaseEntryController {
  constructor(private readonly purchaseEntryService: PurchaseEntryService) {}

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

  /** Whole-amount FIFO payment across supplier outstanding invoices. */
  @Post('/supplier/:id/pay')
  async paySupplier(
    @Param('id') id: string,
    @Body() dto: SupplierBulkPaymentDto,
  ) {
    return {
      data: await this.purchaseEntryService.paySupplierOutstanding(id, dto),
      message: 'Supplier payment allocated successfully',
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
