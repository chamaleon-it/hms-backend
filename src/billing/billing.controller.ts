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
import { BillingService } from './billing.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import mongoose from 'mongoose';
import { GetBillisDto } from './dto/get-bills.dto';
import { AddBillingItemDto } from './dto/add-billing-item.dto';
import { GetBillingItemDto } from './dto/get-billing-item.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { MarkAsPaidDto } from './dto/mark-as-paind.dto';
import { UpdateBillingItemDto } from './dto/update-billing-item.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async generateBill(
    @Body() createBill: CreateBillingDto,
    @GetUser() user: JWTUserInterface,
  ) {
    createBill.user = user.id;
    const data = await this.billingService.generateBill(createBill);

    return {
      message: 'Bill is created successfully.',
      data,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getBills(
    @GetUser() user: JWTUserInterface,
    @Query() getBillisDto: GetBillisDto,
  ) {
    const { data, total } = await this.billingService.getBills(
      user.id,
      getBillisDto,
    );
    return {
      message: 'All bills were retrived successfully.',
      data,
      total,
      page: Number(getBillisDto.page),
      limit: Number(getBillisDto.limit),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('billing_item')
  async addBillingItem(
    @Body() addBillingItemDto: AddBillingItemDto,
    @GetUser() user: JWTUserInterface,
  ) {
    const data = await this.billingService.addBillingItem(
      addBillingItemDto,
      user.id,
    );
    return {
      data,
      message: 'New item added to billing.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('billing_items')
  async getBillingItems(
    @Query() getBillingItemDto: GetBillingItemDto,
    @GetUser() user: JWTUserInterface,
  ) {
    const data = await this.billingService.getBillingItems(
      getBillingItemDto,
      user.id,
    );
    return {
      data,
      message: 'billing item retrived successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('billing_item/:id')
  async updateBillingItem(
    @Param('id') id: mongoose.Types.ObjectId,
    @Body() updateBillingItemDto: UpdateBillingItemDto,
    @GetUser() user: JWTUserInterface,
  ) {
    const data = await this.billingService.updateBillingItem(
      id,
      updateBillingItemDto,
      user.id,
    );
    return {
      data,
      message: 'Item is updated successfully.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('billing_item')
  async deleteBillingItem(
    @Query('item') item: string,
    @GetUser() user: JWTUserInterface,
  ) {
    const data = await this.billingService.deleteBillingItem(item, user.id);
    return {
      message: 'Item is deleted',
      data,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getBill(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.billingService.getBill(id);
    return {
      data,
      message: 'Bill were retrived successfully.',
    };
  }

  @Patch('add_payment/:id')
  @UseGuards(JwtAuthGuard)
  async addPayment(
    @Param('id') id: mongoose.Types.ObjectId,
    @Body() addPaymentDto: AddPaymentDto,
    @GetUser() user: JWTUserInterface,
  ) {
    const data = await this.billingService.addPayment(
      id,
      addPaymentDto,
      user.id,
    );
    return {
      data,
      message: 'Payment is added successfully.',
    };
  }

  @Patch('mark_as_paid/:id')
  @UseGuards(JwtAuthGuard)
  async markAsPaid(
    @Param('id') id: mongoose.Types.ObjectId,
    @Body() markAsPaidDto: MarkAsPaidDto,
  ) {
    const data = await this.billingService.markAsPaid(id, markAsPaidDto);
    return {
      data,
      message: 'Bill is marked as paid successfully.',
    };
  }
}
