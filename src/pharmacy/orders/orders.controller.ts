import { Controller, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';

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
}
