import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import mongoose from 'mongoose';
import { PackedDto } from './dto/packed.dto';
import { MarkAllAsPackedDto } from './dto/markAllAsPacked.dto copy';

@Controller('pharmacy/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async getOrders() {
    const data = await this.ordersService.getOrders();
    return {
      data,
      message: 'All orders where retrived successfully',
    };
  }

  @Get('single')
  async getSingleOrder(@Query('q') q: string) {
    const data = await this.ordersService.getSingleOrder(q);
    return {
      data,
      message: 'Single order were retrived successfully',
    };
  }

  @Delete(':id')
  async deleteOrder(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.ordersService.deleteOrder(id);
    return {
      data,
      message: 'Successfully removed the order',
    };
  }

  @Post('packed')
  async itemPacked(@Body() packedDto: PackedDto) {
    const data = await this.ordersService.itemPacked(packedDto);
    return {
      message: 'Item is packed',
      data,
    };
  }

  @Post('mark_all_as_packed')
  async markAllAsPacked(@Body() markAllAsPackedDto: MarkAllAsPackedDto) {
    const data = await this.ordersService.markAllAsPacked(markAllAsPackedDto);
    return {
      message: 'All item is packed',
      data,
    };
  }
}
