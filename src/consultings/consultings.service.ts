import { BadRequestException, Injectable } from '@nestjs/common';
import { ConsultingDto } from './dto/consulting.dto';
import mongoose, { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Consulting } from './schemas/consulting.schema';
import { Therapy } from 'src/therapy/schemas/therapy.schema';
import { OrdersService } from 'src/pharmacy/orders/orders.service';
import {
  OrderPriority,
  OrderStatus,
} from 'src/pharmacy/orders/schemas/order.schema';
import { ReportService } from 'src/lab/report/report.service';
import { ReportStatus } from 'src/lab/report/schemas/report.schema';
import { BillingService } from 'src/billing/billing.service';
import configuration from 'src/config/configuration';

@Injectable()
export class ConsultingsService {
  constructor(
    @InjectModel(Consulting.name) private consultingModel: Model<Consulting>,
    @InjectModel(Therapy.name) private therapyModel: Model<Therapy>,
    private readonly ordersService: OrdersService,
    private readonly reportService: ReportService,
    private readonly billingService: BillingService,
  ) {}

  async create(
    consultingDto: ConsultingDto,
    doctorId: mongoose.Types.ObjectId,
  ) {
    const consulting = await this.consultingModel.create({
      ...consultingDto,
      doctor: doctorId,
    });

    const inventoryMedicines = consultingDto.medicines.filter(
      (m) => !m.isCustom && m.name && mongoose.isValidObjectId(m.name),
    );

    if (inventoryMedicines.length) {
      await this.ordersService.createOrder({
        doctor: doctorId,
        items: inventoryMedicines as any,
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
    }[] = (consultingDto.test || []).map((t) => ({
      patient: consultingDto.patient,
      doctor: doctorId,
      lab:
        t.lab ?? new mongoose.Types.ObjectId(configuration().in_house_lab_id),
      date: t.date,
      test: t.name.map((n) => ({ name: n })),
      priority: t.priority,
      panels: t.panels,
      sampleType: '',
      status: ReportStatus.UPCOMING,
    }));

    await Promise.all(tests.map((t) => this.reportService.createReport(t)));

    // Generate Reception Bill for prescribed Therapies
    let therapyIds: string[] = [];
    if (Array.isArray(consultingDto.therapy)) {
      therapyIds = consultingDto.therapy
        .map((id: any) =>
          typeof id === 'object' && id?._id
            ? id._id.toString()
            : String(id),
        )
        .filter((id: string) => mongoose.isValidObjectId(id));
    } else if (
      typeof consultingDto.therapy === 'string' &&
      mongoose.isValidObjectId(consultingDto.therapy)
    ) {
      therapyIds = [consultingDto.therapy];
    }

    if (therapyIds.length > 0) {
      const therapies = await this.therapyModel.find({
        _id: { $in: therapyIds },
        isDeleted: false,
      });

      if (therapies.length > 0) {
        let receptionUserIdStr = configuration().in_house_reception_id;

        if (
          !receptionUserIdStr ||
          !mongoose.isValidObjectId(receptionUserIdStr)
        ) {
          const receptionUser = await this.consultingModel.db
            .collection('users')
            .findOne({ role: 'Reception' });
          if (receptionUser) {
            receptionUserIdStr = receptionUser._id.toString();
          }
        }

        if (receptionUserIdStr && mongoose.isValidObjectId(receptionUserIdStr)) {
          const doctorUser = await this.consultingModel.db
            .collection('users')
            .findOne({ _id: new mongoose.Types.ObjectId(doctorId) });
          const doctorName = doctorUser?.name
            ? `Dr. ${doctorUser.name}`
            : 'Doctor';

          const billingItems = therapies.map((t) => ({
            name: t.name,
            quantity: 1,
            unitPrice: t.price,
            gst: 0,
            discount: 0,
            total: t.price,
          }));

          try {
            await this.billingService.generateBill({
              user: new mongoose.Types.ObjectId(receptionUserIdStr),
              patient: consultingDto.patient,
              doctor: doctorName,
              items: billingItems,
              status: 'Draft',
              transactionType: 'Sale',
              note:
                consultingDto.therapyNotes ||
                'Therapy Bill from Doctor Consultation',
            });
          } catch (err) {
            console.error('Error generating therapy bill for reception:', err);
          }
        }
      }
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
      .populate('therapy')
      .sort({ createdAt: -1 })
      .lean();
    return data;
  }
}

