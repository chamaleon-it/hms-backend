import { BadRequestException, Injectable } from '@nestjs/common';
import { ConsultingDto } from './dto/consulting.dto';
import mongoose, { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Consulting } from './schemas/consulting.schema';
import { OrdersService } from 'src/pharmacy/orders/orders.service';
import {
  OrderPriority,
  OrderStatus,
} from 'src/pharmacy/orders/schemas/order.schema';
import { ReportService } from 'src/lab/report/report.service';
import { ReportStatus, SampleType } from 'src/lab/schemas/report.schema';

@Injectable()
export class ConsultingsService {
  constructor(
    @InjectModel(Consulting.name) private consultingModel: Model<Consulting>,
    private readonly ordersService: OrdersService,
    private readonly reportService: ReportService,
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

    const tests: {
      patient: Types.ObjectId;
      doctor: Types.ObjectId;
      lab: Types.ObjectId;
      date: Date;
      priority: string;
      name: {
        code: string;
        max?: number;
        min?: number;
        name: string;
        type: 'Lab' | 'Imaging';
        unit: string;
        _id?: Types.ObjectId | undefined;
      }[];
      sampleType: SampleType;
      status: ReportStatus;
    }[] = consultingDto.test.map((t) => ({
      patient: consultingDto.patient,
      doctor: doctorId,
      lab: t.lab,
      date: t.date,
      name: t.name,
      priority: t.priority,
      sampleType: SampleType.OTHER,
      status: ReportStatus.PENDING,
    }));

    await Promise.all(tests.map((t) => this.reportService.createReport(t)));

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
