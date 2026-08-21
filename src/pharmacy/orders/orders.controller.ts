import {
  BadRequestException,
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
import { OrdersService } from './orders.service';
import mongoose from 'mongoose';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/schemas/user.schema';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/UpdateOrder.dto';
import { GetCustomersDto } from './dto/get-customers.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Controller('pharmacy/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Roles(...[UserRole.PHARMACY, UserRole.RECEPTION, UserRole.DOCTOR])

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const data = await this.ordersService.createOrder(dto);
    return {
      message: 'Order created successfully',
      data,
    };
  }

  @Roles(...[UserRole.ADMIN, UserRole.PHARMACY, UserRole.RECEPTION, UserRole.DOCTOR])

  @Get()
  async getOrders(@Query() query: GetOrdersDto) {
    const { data, total } = await this.ordersService.getOrders(query);
    return {
      data,
      total,
      page: Number(query.page),
      limit: Number(query.limit),
      message: 'All orders where retrieved successfully',
    };
  }

  @Roles(...[UserRole.ADMIN, UserRole.PHARMACY, UserRole.RECEPTION, UserRole.DOCTOR])

  @Get('single')
  async getSingleOrder(@Query('q') q: string) {
    const data = await this.ordersService.getSingleOrder(q);
    return {
      data,
      message: 'Single order were retrieved successfully',
    };
  }

  @Roles(...[UserRole.PHARMACY, UserRole.RECEPTION, UserRole.DOCTOR])

  @Delete(':id')
  async deleteOrder(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.ordersService.deleteOrder(id);
    return {
      data,
      message: 'Successfully removed the order',
    };
  }
  @Roles(...[UserRole.ADMIN, UserRole.PHARMACY, UserRole.RECEPTION, UserRole.DOCTOR])
  @Get('customers')
  async getCustomers(@Query() query: GetCustomersDto) {
    const { data, total } = await this.ordersService.getCustomers(query);
    return {
      data,
      total,
      page: Number(query.page),
      limit: Number(query.limit),
      message: 'All customers data were retrieved successfully.',
    };
  }

  @Roles(...[UserRole.ADMIN, UserRole.PHARMACY, UserRole.RECEPTION, UserRole.DOCTOR])

  @Get('customers/:patient')
  async getCustomer(@Param('patient') patient: string) {
    if (!mongoose.isValidObjectId(patient))
      throw new BadRequestException('Please provide a valid patient id');
    const data = await this.ordersService.getCustomer(
      new mongoose.Types.ObjectId(patient),
    );
    return {
      data,
      message: 'Customer data were retrieved successfully.',
    };
  }

  @Roles(...[UserRole.ADMIN, UserRole.PHARMACY, UserRole.RECEPTION, UserRole.DOCTOR])

  @Get('patient/:patient')
  async getOrdersByPatient(@Param('patient') patient: string) {
    if (!mongoose.isValidObjectId(patient))
      throw new BadRequestException('Please provide a valid patient id');
    const data = await this.ordersService.getOrdersByPatient(
      new mongoose.Types.ObjectId(patient),
    );
    return {
      data,
      message: 'Patient pharmacy orders retrieved successfully.',
    };
  }

  @Roles(...[UserRole.PHARMACY, UserRole.RECEPTION, UserRole.DOCTOR])

  @Patch('update')
  async updateOrder(@Body() dto: UpdateOrderDto) {
    const data = await this.ordersService.updateOrder(dto);
    return {
      message: 'Order updated successfully',
      data,
    };
  }
  @Roles(...[UserRole.PHARMACY, UserRole.RECEPTION, UserRole.DOCTOR])
  @Patch('complete/:id')
  async completeOrder(
    @Param('id') id: mongoose.Types.ObjectId,
    @GetUser() user: JWTUserInterface,
  ) {
    const data = await this.ordersService.completeOrder(id, user?.id);
    return {
      message: 'Order completed successfully',
      data,
    };
  }

  @Roles(...[UserRole.PHARMACY, UserRole.RECEPTION, UserRole.DOCTOR])

  @Post('repeat_order/:id')
  async repeatOrder(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.ordersService.repeatOrder(id);
    return {
      message: 'Order repeated successfully',
      data,
    };
  }

  @Roles(...[UserRole.PHARMACY, UserRole.RECEPTION, UserRole.DOCTOR])

  @Patch('update_payment')
  async updatePayment(@Body() dto: UpdatePaymentDto) {
    const data = await this.ordersService.updatePayment(dto);
    return {
      message: 'Payment updated successfully',
      data,
    };
  }

  @Roles(...[UserRole.PHARMACY, UserRole.RECEPTION, UserRole.DOCTOR])

  @Post('recover/:id')
  async recoverOrder(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.ordersService.recoverOrder(id);
    return {
      message: 'Order recovered successfully',
      data,
    };
  }
}
