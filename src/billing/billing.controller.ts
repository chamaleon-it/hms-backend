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
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/schemas/user.schema';
import mongoose from 'mongoose';
import { GetBillisDto } from './dto/get-bills.dto';
import { AddBillingItemDto } from './dto/add-billing-item.dto';
import { GetBillingItemDto } from './dto/get-billing-item.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { MarkAsPaidDto } from './dto/mark-as-paind.dto';
import { UpdateBillingItemDto } from './dto/update-billing-item.dto';
import { GetBillDropdownDto } from './dto/get-bill-dropdown.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) { }

  @Roles(...[UserRole.RECEPTION, UserRole.PHARMACY, UserRole.LAB, UserRole.DOCTOR])

  @Post()
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

  @Roles(...[UserRole.ADMIN, UserRole.RECEPTION, UserRole.PHARMACY, UserRole.LAB, UserRole.DOCTOR])

  @Get()
  async getBills(
    @GetUser() user: JWTUserInterface,
    @Query() getBillisDto: GetBillisDto,
  ) {
    const { data, total } = await this.billingService.getBills(
      user.id,
      getBillisDto,
    );
    return {
      message: 'All bills were retrieved successfully.',
      data,
      total,
      page: Number(getBillisDto.page),
      limit: Number(getBillisDto.limit),
    };
  }

  @Roles(...[UserRole.ADMIN, UserRole.RECEPTION, UserRole.PHARMACY, UserRole.LAB, UserRole.DOCTOR])

  @Get('drop-down')
  async getBillDropDown(@Query() getBillDropDownDto: GetBillDropdownDto) {
    const data = await this.billingService.getBillDropDown(getBillDropDownDto);
    return {
      data,
      message: 'Bill drop down retrieved successfully',
    };
  }

  @Roles(...[UserRole.ADMIN, UserRole.RECEPTION, UserRole.PHARMACY, UserRole.LAB, UserRole.DOCTOR])

  @Get('single')
  async getSingleCustomerBill(@Query('q') q: string) {
    const data = await this.billingService.getSingleCustomerBill(q);
    return {
      data,
      message: 'Single bill were retrieved successfully',
    };
  }

  @Roles(...[UserRole.RECEPTION, UserRole.PHARMACY, UserRole.LAB, UserRole.DOCTOR])

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

  @Roles(...[UserRole.ADMIN, UserRole.RECEPTION, UserRole.PHARMACY, UserRole.LAB, UserRole.DOCTOR])

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
      message: 'billing item retrieved successfully',
    };
  }

  @Roles(...[UserRole.RECEPTION, UserRole.PHARMACY, UserRole.LAB, UserRole.DOCTOR])

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

  @Roles(...[UserRole.RECEPTION, UserRole.PHARMACY, UserRole.LAB, UserRole.DOCTOR])

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

  @Roles(...[UserRole.ADMIN, UserRole.RECEPTION, UserRole.PHARMACY, UserRole.LAB, UserRole.DOCTOR])

  @Get('report/:reportId')
  async getBillByReportId(
    @Param('reportId') reportId: mongoose.Types.ObjectId,
  ) {
    const data = await this.billingService.getBillByReportId(reportId);
    return {
      data,
      message: 'Bill retrieved successfully by report ID.',
    };
  }

  @Roles(...[UserRole.ADMIN, UserRole.RECEPTION, UserRole.PHARMACY, UserRole.LAB, UserRole.DOCTOR])

  @Get(':id')
  async getBill(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.billingService.getBill(id);
    return {
      data,
      message: 'Bill were retrieved successfully.',
    };
  }

  @Roles(...[UserRole.RECEPTION, UserRole.PHARMACY, UserRole.LAB, UserRole.DOCTOR])

  @Patch(':id')
  async updateBill(
    @Param('id') id: mongoose.Types.ObjectId,
    @Body() updateBillDto: UpdateBillingDto,
  ) {
    const data = await this.billingService.updateBill(id, updateBillDto);
    return {
      data,
      message: 'Bill updated successfully.',
    };
  }

  @Roles(...[UserRole.RECEPTION, UserRole.PHARMACY, UserRole.LAB, UserRole.DOCTOR])

  @Patch('add_payment/:id')
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

  @Roles(...[UserRole.RECEPTION, UserRole.PHARMACY, UserRole.LAB, UserRole.DOCTOR])

  @Patch('mark_as_paid/:id')
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
