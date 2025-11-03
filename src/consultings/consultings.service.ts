import { BadRequestException, Injectable } from '@nestjs/common';
import { ConsultingDto } from './dto/consulting.dto';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Consulting } from './schemas/consulting.schema';
import { OrdersService } from 'src/pharmacy/orders/orders.service';
import {
  OrderPriority,
  OrderStatus,
} from 'src/pharmacy/orders/schemas/order.schema';

@Injectable()
export class ConsultingsService {
  constructor(
    @InjectModel(Consulting.name) private consultingModel: Model<Consulting>,
    private readonly ordersService: OrdersService,
  ) {}

  async create(
    consultingDto: ConsultingDto,
    doctorId: mongoose.Types.ObjectId,
  ) {
    const consulting = await this.consultingModel.create({
      ...consultingDto,
      doctor: doctorId,
    });

    if (consultingDto.medicines.length) {
      await this.ordersService.createOrder({
        doctor: doctorId,
        items: consultingDto.medicines,
        patient: consultingDto.patient,
        priority: OrderPriority.Normal,
        status: OrderStatus.Pending,
      });
    }
    return consulting;
  }

  async getPatientConsultings(patientId: string) {
    if (!mongoose.isValidObjectId(patientId)) {
      throw new BadRequestException('Please provide a valid patient id');
    }
    const data = await this.consultingModel
      .find({ patient: patientId })
      .populate('patient')
      .populate('appointment')
      .populate('doctor', 'name email specialization')
      .populate('medicines.name', 'name')
      .sort({ createdAt: -1 })
      .lean();
    return data;
  }
}
