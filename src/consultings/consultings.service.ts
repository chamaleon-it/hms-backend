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
import { ReportStatus } from 'src/lab/report/schemas/report.schema';
import configuration from 'src/config/configuration';

@Injectable()
export class ConsultingsService {
  constructor(
    @InjectModel(Consulting.name) private consultingModel: Model<Consulting>,
    private readonly ordersService: OrdersService,
    private readonly reportService: ReportService,
  ) { }

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
      panels: string[];
      test: {
        name: mongoose.Types.ObjectId;
        value?: string | number;
      }[];
      sampleType: string;
      status: ReportStatus;
    }[] = consultingDto.test.map((t) => ({
      patient: consultingDto.patient,
      doctor: doctorId,
      lab:
        t.lab ?? new mongoose.Types.ObjectId(configuration().in_house_lab_id),
      date: t.date,
      test: t.name.map((n) => ({ name: n })),
      priority: t.priority,
      panels: t.panels,
      sampleType: "",
      status: ReportStatus.UPCOMING,
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
