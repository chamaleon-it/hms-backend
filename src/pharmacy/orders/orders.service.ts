import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { Model } from 'mongoose';

@Injectable()
export class OrdersService {
  constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}

  private async generateUniqueMRN(): Promise<string> {
    let mrn: string;
    let exists = true;

    do {
      const randomNum = Math.floor(1000000 + Math.random() * 9000000);
      mrn = `RX${randomNum}`;

      // Check if MRN already exists
      const existing = await this.orderModel.exists({ mrn });
      exists = !!existing;
    } while (exists);

    return mrn;
  }

  async createOrder(order: CreateOrderDto) {
    const mrn = await this.generateUniqueMRN();
    order.mrn = mrn;
    const data = await this.orderModel.create(order);
    return data;
  }

  async getOrders() {
    const data = await this.orderModel
      .find()
      .populate('patient')
      .populate('doctor', 'name phoneNumber specialization')
      .populate('items.name');
    return data;
  }
}
