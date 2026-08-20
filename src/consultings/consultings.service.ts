import { BadRequestException, Injectable } from '@nestjs/common';
import { ConsultingDto } from './dto/consulting.dto';
import mongoose, { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Consulting } from './schemas/consulting.schema';
import { Therapy } from 'src/therapy/schemas/therapy.schema';
import { ProcedureService } from 'src/procedure/procedure.service';
import { OrdersService } from 'src/pharmacy/orders/orders.service';
import {
  OrderPriority,
  OrderStatus,
} from 'src/pharmacy/orders/schemas/order.schema';
import { ReportService } from 'src/lab/report/report.service';
import { ReportStatus } from 'src/lab/report/schemas/report.schema';
import { BillingService } from 'src/billing/billing.service';
import configuration from 'src/config/configuration';

import { TherapyService } from 'src/therapy/therapy.service';
import { TreatmentService } from 'src/treatment/treatment.service';
import { TreatmentType } from 'src/treatment/schemas/treatment.schema';

@Injectable()
export class ConsultingsService {
  constructor(
    @InjectModel(Consulting.name) private consultingModel: Model<Consulting>,
    @InjectModel(Therapy.name) private therapyModel: Model<Therapy>,
    private readonly therapyService: TherapyService,
    private readonly procedureService: ProcedureService,
    private readonly ordersService: OrdersService,
    private readonly reportService: ReportService,
    private readonly billingService: BillingService,
    private readonly treatmentService: TreatmentService,
  ) {}

  async create(
    consultingDto: ConsultingDto,
    doctorId: mongoose.Types.ObjectId,
  ) {
    const inHouseLabId = configuration().in_house_lab_id;
    const defaultLabObjectId =
      inHouseLabId && mongoose.isValidObjectId(inHouseLabId)
        ? new mongoose.Types.ObjectId(inHouseLabId)
        : new mongoose.Types.ObjectId();

    if (Array.isArray(consultingDto.test)) {
      consultingDto.test = consultingDto.test.map((t) => {
        const validLab =
          t.lab && mongoose.isValidObjectId(t.lab.toString())
            ? new mongoose.Types.ObjectId(t.lab.toString())
            : defaultLabObjectId;
        return {
          ...t,
          lab: validLab as any,
        };
      });
    }

    // Resolve Therapy Items
    let resolvedTherapies: any[] = [];
    if (consultingDto.therapy) {
      const rawTherapyList = Array.isArray(consultingDto.therapy)
        ? consultingDto.therapy
        : [consultingDto.therapy];
      resolvedTherapies = await this.therapyService.resolveTherapyItems(
        rawTherapyList,
      );
    }

    // Resolve Procedure Items
    let resolvedProcedures: any[] = [];
    if (consultingDto.procedure) {
      const rawProcList = Array.isArray(consultingDto.procedure)
        ? consultingDto.procedure
        : [consultingDto.procedure];
      resolvedProcedures = await this.procedureService.resolveProcedureItems(
        rawProcList,
      );
    }

    const consulting = await this.consultingModel.create({
      ...consultingDto,
      therapy: resolvedTherapies,
      procedure: resolvedProcedures,
      doctor: doctorId,
    });

    const inventoryMedicines = (consultingDto.medicines || []).filter(
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
        t.lab && mongoose.isValidObjectId(t.lab.toString())
          ? new mongoose.Types.ObjectId(t.lab.toString())
          : defaultLabObjectId,
      date: t.date,
      test: t.name.map((n) => ({ name: n })),
      priority: t.priority,
      panels: t.panels,
      sampleType: '',
      status: ReportStatus.UPCOMING,
    }));

    await Promise.all(tests.map((t) => this.reportService.createReport(t)));

    const doctorUser = await this.consultingModel.db
      .collection('users')
      .findOne({ _id: new mongoose.Types.ObjectId(doctorId) });
    const doctorName = doctorUser?.name
      ? `Dr. ${doctorUser.name}`
      : 'Doctor';

    // 1. Create Treatment Request for prescribed Therapies (if any)
    if (resolvedTherapies.length > 0) {
      try {
        await this.treatmentService.createFromConsultation({
          type: TreatmentType.Therapy,
          items: resolvedTherapies,
          patient: consultingDto.patient,
          doctor: doctorId,
          doctorName,
          treatmentDates: (consultingDto as any).therapyDates,
          notes:
            consultingDto.therapyNotes ||
            'Therapy prescribed from Doctor Consultation',
          consultingId: consulting._id as any,
        });
      } catch (err) {
        console.error('Error creating therapy treatment request:', err);
      }
    }

    // 2. Create Treatment Request for prescribed Procedures (if any)
    if (resolvedProcedures.length > 0) {
      try {
        await this.treatmentService.createFromConsultation({
          type: TreatmentType.Procedure,
          items: resolvedProcedures,
          patient: consultingDto.patient,
          doctor: doctorId,
          doctorName,
          treatmentDates: (consultingDto as any).procedureDates,
          notes:
            consultingDto.procedureNotes ||
            'Procedure prescribed from Doctor Consultation',
          consultingId: consulting._id as any,
        });
      } catch (err) {
        console.error('Error creating procedure treatment request:', err);
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
      .populate('test.name', 'name code type panels')
      .populate('therapy')
      .sort({ createdAt: -1 })
      .lean();
    return data;
  }

  async updateTherapyStatus(id: string, completed: boolean) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Please provide a valid consulting id');
    }
    const data = await this.consultingModel
      .findByIdAndUpdate(id, { therapyCompleted: completed }, { new: true })
      .populate('therapy')
      .lean();
    return data;
  }

  async updateProcedureStatus(id: string, completed: boolean) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Please provide a valid consulting id');
    }
    const data = await this.consultingModel
      .findByIdAndUpdate(id, { procedureCompleted: completed }, { new: true })
      .lean();
    return data;
  }
}
