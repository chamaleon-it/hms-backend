import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
    const data = await this.billingService.getBills(user.id, getBillisDto);
    return {
      message: 'All bills were retrived successfully.',
      data,
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
}
