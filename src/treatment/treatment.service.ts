import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import {
  Treatment,
  TreatmentBillingStatus,
  TreatmentDocument,
  TreatmentStatus,
  TreatmentType,
} from './schemas/treatment.schema';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { ProcessTreatmentDto } from './dto/process-treatment.dto';
import { RepeatTreatmentDto } from './dto/repeat-treatment.dto';
import { GetTreatmentsDto } from './dto/get-treatments.dto';
import { Employee, EmployeeDocument } from '../employee/schemas/employee.schema';
import { BillingService } from '../billing/billing.service';
import configuration from '../config/configuration';

@Injectable()
export class TreatmentService {
  constructor(
    @InjectModel(Treatment.name)
    private treatmentModel: Model<TreatmentDocument>,
    @InjectModel(Employee.name)
    private employeeModel: Model<EmployeeDocument>,
    private readonly billingService: BillingService,
  ) {}

  private async generateUniqueMRN(): Promise<string> {
    const prefix = 'TRT-';
    const lastRecord = await this.treatmentModel
      .findOne({ mrn: { $regex: `^${prefix}\\d+$` } })
      .collation({ locale: 'en_US', numericOrdering: true })
      .sort({ mrn: -1 })
      .select('mrn')
      .lean()
      .exec();

    let nextNumber = 1;
    if (lastRecord && lastRecord.mrn) {
      const match = lastRecord.mrn.match(new RegExp(`^${prefix}(\\d+)$`));
      if (match && match[1]) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    let mrn: string;
    let exists = true;
    do {
      mrn = `${prefix}${nextNumber.toString().padStart(5, '0')}`;
      const existing = await this.treatmentModel.exists({ mrn });
      exists = !!existing;
      if (exists) nextNumber++;
    } while (exists);

    return mrn;
  }

  async getDefaultTherapist(): Promise<{
    therapist: Types.ObjectId | null;
    therapistName: string;
  }> {
    const inChargeTherapist = await this.employeeModel
      .findOne({
        role: { $regex: new RegExp('^Therapist$', 'i') },
        inCharge: true,
        isDeleted: { $ne: true },
        status: { $regex: new RegExp('^active$', 'i') },
      })
      .lean()
      .exec();

    if (inChargeTherapist) {
      return {
        therapist: inChargeTherapist._id as Types.ObjectId,
        therapistName: inChargeTherapist.name,
      };
    }

    const firstTherapist = await this.employeeModel
      .findOne({
        role: { $regex: new RegExp('^Therapist$', 'i') },
        isDeleted: { $ne: true },
        status: { $regex: new RegExp('^active$', 'i') },
      })
      .lean()
      .exec();

    if (firstTherapist) {
      return {
        therapist: firstTherapist._id as Types.ObjectId,
        therapistName: firstTherapist.name,
      };
    }

    return {
      therapist: null,
      therapistName: 'Therapist In-Charge',
    };
  }

  async createFromConsultation(payload: {
    type: TreatmentType;
    items: any[];
    patient: mongoose.Types.ObjectId;
    doctor?: mongoose.Types.ObjectId;
    doctorName?: string;
    notes?: string;
    consultingId?: mongoose.Types.ObjectId;
    treatmentDates?: (Date | string)[];
    treatmentDate?: Date | string;
  }): Promise<Treatment> {
    if (!payload.items || payload.items.length === 0) {
      throw new BadRequestException('Treatment items are required');
    }

    const { therapist, therapistName } = await this.getDefaultTherapist();

    const formattedItems = payload.items.map((item) => {
      const unitPrice = Number(item.price ?? item.unitPrice ?? 0);
      const quantity = Number(item.quantity ?? 1);
      const discount = Number(item.discount ?? 0);
      const gst = Number(item.gst ?? 0);
      const total = Number(item.total ?? unitPrice * quantity - discount);

      return {
        name: item.parentName
          ? `${item.parentName} - ${item.name}`
          : item.name || 'Treatment Item',
        therapyId:
          item.therapyId && mongoose.isValidObjectId(item.therapyId)
            ? new mongoose.Types.ObjectId(item.therapyId)
            : undefined,
        subTherapyId: item.subTherapyId ? String(item.subTherapyId) : undefined,
        procedureId:
          item.procedureId && mongoose.isValidObjectId(item.procedureId)
            ? new mongoose.Types.ObjectId(item.procedureId)
            : undefined,
        subProcedureId: item.subProcedureId
          ? String(item.subProcedureId)
          : undefined,
        parentName: item.parentName || undefined,
        code: item.code || undefined,
        quantity,
        unitPrice,
        gst,
        discount,
        total,
      };
    });

    const category =
      payload.type === TreatmentType.Procedure ? 'Procedure' : 'Therapy';

    const dates: Date[] =
      payload.treatmentDates && payload.treatmentDates.length > 0
        ? payload.treatmentDates.map((d) => new Date(d))
        : [payload.treatmentDate ? new Date(payload.treatmentDate) : new Date()];

    dates.sort((a, b) => a.getTime() - b.getTime());

    const rootMrn = await this.generateUniqueMRN();

    const rootTreatment = new this.treatmentModel({
      mrn: rootMrn,
      patient: payload.patient,
      doctor: payload.doctor || null,
      doctorName: payload.doctorName || 'Doctor',
      consulting: payload.consultingId || null,
      type: payload.type,
      category,
      items: formattedItems,
      therapist,
      therapistName,
      status: TreatmentStatus.Pending,
      billingStatus: TreatmentBillingStatus.Unbilled,
      prescriptionDate: new Date(),
      treatmentDate: dates[0],
      notes: payload.notes || '',
      sessionNumber: 1,
      parentTreatment: null,
      isRepeated: false,
      isDeleted: false,
    });

    const savedRoot = await rootTreatment.save();

    if (dates.length > 1) {
      for (let i = 1; i < dates.length; i++) {
        const sessionMrn = await this.generateUniqueMRN();
        const nextSession = new this.treatmentModel({
          mrn: sessionMrn,
          patient: payload.patient,
          doctor: payload.doctor || null,
          doctorName: payload.doctorName || 'Doctor',
          consulting: payload.consultingId || null,
          type: payload.type,
          category,
          items: formattedItems,
          therapist,
          therapistName,
          status: TreatmentStatus.Pending,
          billingStatus: TreatmentBillingStatus.Unbilled,
          prescriptionDate: new Date(),
          treatmentDate: dates[i],
          notes: payload.notes || '',
          sessionNumber: i + 1,
          parentTreatment: savedRoot._id,
          isRepeated: true,
          isDeleted: false,
        });
        await nextSession.save();
      }
    }

    return savedRoot;
  }

  async create(createDto: CreateTreatmentDto): Promise<Treatment> {
    let therapistId = createDto.therapist;
    let therapistName = createDto.therapistName;

    if (!therapistName || therapistName.trim() === '' || therapistName === '-') {
      const def = await this.getDefaultTherapist();
      therapistId = (def.therapist as any) || therapistId;
      therapistName = def.therapistName;
    }

    if (!therapistName || therapistName.trim() === '') {
      throw new BadRequestException('Therapist assignment is mandatory');
    }

    const mrn = await this.generateUniqueMRN();

    const formattedItems = (createDto.items || []).map((item) => {
      const unitPrice = Number(item.unitPrice ?? 0);
      const quantity = Number(item.quantity ?? 1);
      const discount = Number(item.discount ?? 0);
      const gst = Number(item.gst ?? 0);
      const total = Number(item.total ?? unitPrice * quantity - discount);

      return {
        ...item,
        quantity,
        unitPrice,
        discount,
        gst,
        total,
      };
    });

    const dates: Date[] =
      createDto.treatmentDates && createDto.treatmentDates.length > 0
        ? createDto.treatmentDates.map((d) => new Date(d))
        : [
            createDto.treatmentDate
              ? new Date(createDto.treatmentDate)
              : new Date(),
          ];

    // Sort dates chronologically
    dates.sort((a, b) => a.getTime() - b.getTime());

    const rootMrn = await this.generateUniqueMRN();

    const rootTreatment = new this.treatmentModel({
      ...createDto,
      mrn: rootMrn,
      therapist: therapistId,
      therapistName,
      items: formattedItems,
      type: createDto.type || TreatmentType.Therapy,
      category:
        createDto.category ||
        (createDto.type === TreatmentType.Procedure ? 'Procedure' : 'Therapy'),
      status: createDto.status || TreatmentStatus.Pending,
      billingStatus: TreatmentBillingStatus.Unbilled,
      prescriptionDate: createDto.prescriptionDate || new Date(),
      treatmentDate: dates[0],
      sessionNumber: 1,
      parentTreatment: null,
      isRepeated: false,
      isDeleted: false,
    });

    const savedRoot = await rootTreatment.save();

    // If multiple dates were provided, automatically create subsequent sessions linked to root
    if (dates.length > 1) {
      for (let i = 1; i < dates.length; i++) {
        const sessionMrn = await this.generateUniqueMRN();
        const nextSession = new this.treatmentModel({
          mrn: sessionMrn,
          patient: createDto.patient,
          doctor: createDto.doctor || null,
          doctorName: createDto.doctorName || 'Self',
          consulting: createDto.consulting || null,
          type: createDto.type || TreatmentType.Therapy,
          category:
            createDto.category ||
            (createDto.type === TreatmentType.Procedure
              ? 'Procedure'
              : 'Therapy'),
          items: formattedItems,
          therapist: therapistId,
          therapistName,
          status: TreatmentStatus.Pending,
          billingStatus: TreatmentBillingStatus.Unbilled,
          prescriptionDate: createDto.prescriptionDate || new Date(),
          treatmentDate: dates[i],
          notes: createDto.notes || '',
          discount: createDto.discount || 0,
          sessionNumber: i + 1,
          parentTreatment: savedRoot._id,
          isRepeated: true,
          isDeleted: false,
        });
        await nextSession.save();
      }
    }

    return savedRoot;
  }

  async findAll(query: GetTreatmentsDto): Promise<{
    data: Treatment[];
    total: number;
    message: string;
  }> {
    const {
      page = 1,
      limit = 20,
      q,
      status,
      type,
      billingStatus,
      startDate,
      endDate,
      patient,
      therapist,
    } = query;

    const skip = (page - 1) * limit;
    const filter: any = { isDeleted: { $ne: true } };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (billingStatus && billingStatus !== 'all') {
      filter.billingStatus = billingStatus;
    }

    if (patient && mongoose.isValidObjectId(patient)) {
      filter.patient = new mongoose.Types.ObjectId(patient);
    }

    const andConditions: any[] = [];

    if (therapist) {
      if (mongoose.isValidObjectId(therapist)) {
        andConditions.push({
          $or: [
            { therapist: new mongoose.Types.ObjectId(therapist) },
            { therapistName: { $regex: therapist, $options: 'i' } },
          ],
        });
      } else {
        filter.therapistName = { $regex: therapist.trim(), $options: 'i' };
      }
    }

    if (startDate && endDate) {
      filter.treatmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      filter.treatmentDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.treatmentDate = { $lte: new Date(endDate) };
    }

    if (q && q.trim()) {
      const searchRegex = { $regex: q.trim(), $options: 'i' };
      andConditions.push({
        $or: [
          { mrn: searchRegex },
          { billNo: searchRegex },
          { doctorName: searchRegex },
          { therapistName: searchRegex },
          { notes: searchRegex },
          { 'items.name': searchRegex },
        ],
      });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    const [data, total] = await Promise.all([
      this.treatmentModel
        .find(filter)
        .populate('patient')
        .populate('doctor', 'name email specialization phoneNumber')
        .populate('therapist')
        .populate('bill')
        .populate('parentTreatment')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.treatmentModel.countDocuments(filter),
    ]);

    return {
      data: data as Treatment[],
      total,
      message: 'Treatments retrieved successfully',
    };
  }

  async findOne(id: string): Promise<Treatment> {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid treatment ID: ${id}`);
    }

    const treatment = await this.treatmentModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('patient')
      .populate('doctor', 'name email specialization phoneNumber')
      .populate('therapist')
      .populate('bill')
      .populate('parentTreatment')
      .populate('consulting')
      .lean()
      .exec();

    if (!treatment) {
      throw new NotFoundException(`Treatment with id ${id} not found`);
    }

    return treatment as Treatment;
  }

  async getTimeline(id: string): Promise<{
    rootTreatment: Treatment;
    sessions: Treatment[];
    totalSessions: number;
    completedSessions: number;
    totalSpend: number;
    patient: any;
    doctor: any;
  }> {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid treatment ID: ${id}`);
    }

    const current = await this.treatmentModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .lean()
      .exec();

    if (!current) {
      throw new NotFoundException(`Treatment with id ${id} not found`);
    }

    // Root is either parentTreatment (if repeated) or current document
    const rootId = current.parentTreatment || current._id;

    // Fetch root treatment and all repeated sessions
    const sessions = await this.treatmentModel
      .find({
        $or: [{ _id: rootId }, { parentTreatment: rootId }],
        isDeleted: { $ne: true },
      })
      .populate('patient')
      .populate('doctor', 'name email specialization phoneNumber')
      .populate('therapist')
      .populate('bill')
      .sort({ sessionNumber: 1, createdAt: 1 })
      .lean()
      .exec();

    const rootTreatment =
      sessions.find((s) => String(s._id) === String(rootId)) || (current as any);

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
      (s) => s.status === TreatmentStatus.Completed,
    ).length;

    const totalSpend = sessions.reduce((sum, s) => {
      const itemsTotal = (s.items || []).reduce(
        (iSum, i) => iSum + (i.total || 0),
        0,
      );
      return sum + itemsTotal - (s.discount || 0);
    }, 0);

    return {
      rootTreatment: rootTreatment as Treatment,
      sessions: sessions as Treatment[],
      totalSessions,
      completedSessions,
      totalSpend,
      patient: rootTreatment?.patient || null,
      doctor: rootTreatment?.doctor || null,
    };
  }

  async update(id: string, dto: UpdateTreatmentDto): Promise<Treatment> {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid treatment ID: ${id}`);
    }

    if (dto.therapistName !== undefined && (!dto.therapistName || dto.therapistName.trim() === '')) {
      throw new BadRequestException('Therapist name cannot be empty');
    }

    const updateData: any = { ...dto };
    if (dto.items) {
      updateData.items = dto.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice ?? 0),
        quantity: Number(item.quantity ?? 1),
        discount: Number(item.discount ?? 0),
        gst: Number(item.gst ?? 0),
        total: Number(
          item.total ??
            Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1) -
              Number(item.discount ?? 0),
        ),
      }));
    }

    const updated = await this.treatmentModel
      .findOneAndUpdate(
        { _id: id, isDeleted: { $ne: true } },
        { $set: updateData },
        { new: true },
      )
      .populate('patient')
      .populate('doctor', 'name email specialization phoneNumber')
      .populate('therapist')
      .populate('bill')
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException(`Treatment with id ${id} not found`);
    }

    return updated as Treatment;
  }

  async processSession(
    id: string,
    dto: ProcessTreatmentDto,
    userId?: mongoose.Types.ObjectId,
  ): Promise<{ treatment: Treatment; bill: any }> {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid treatment ID: ${id}`);
    }

    const treatment = await this.treatmentModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('patient')
      .exec();

    if (!treatment) {
      throw new NotFoundException(`Treatment with id ${id} not found`);
    }

    if (
      treatment.status === TreatmentStatus.Completed ||
      treatment.billingStatus === TreatmentBillingStatus.Billed
    ) {
      throw new BadRequestException(
        `This treatment session has already been processed and billed (Bill #${treatment.billNo || treatment.bill || 'Generated'}).`,
      );
    }

    // Helper to get Reception User ID for billing
    let receptionUserIdStr = configuration().in_house_reception_id;
    if (!receptionUserIdStr || !mongoose.isValidObjectId(receptionUserIdStr)) {
      if (userId && mongoose.isValidObjectId(userId)) {
        receptionUserIdStr = userId.toString();
      } else if (this.treatmentModel?.db?.collection) {
        try {
          const receptionUser = await this.treatmentModel.db
            .collection('users')
            .findOne({ role: 'Reception' });
          if (receptionUser) {
            receptionUserIdStr = receptionUser._id.toString();
          }
        } catch {
          // ignore error
        }
      }
    }
    if (!receptionUserIdStr || !mongoose.isValidObjectId(receptionUserIdStr)) {
      receptionUserIdStr = new mongoose.Types.ObjectId().toString();
    }

    const billingItems = (treatment.items || []).map((item) => ({
      name: item.name,
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      gst: item.gst || 0,
      discount: item.discount || 0,
      total: item.total || (item.quantity || 1) * (item.unitPrice || 0),
    }));

    const totalDiscount =
      dto.discount !== undefined ? dto.discount : treatment.discount || 0;

    const typeLabel =
      treatment.type === TreatmentType.Procedure ? 'Procedure' : 'Therapy';
    const sessionNotes = dto.notes
      ? `[${typeLabel} Session #${treatment.sessionNumber}] ${dto.notes}`
      : treatment.notes
        ? `[${typeLabel} Session #${treatment.sessionNumber}] ${treatment.notes}`
        : `${typeLabel} Session #${treatment.sessionNumber}`;

    const billPayload: any = {
      user: new mongoose.Types.ObjectId(receptionUserIdStr),
      patient: (treatment.patient as any)?._id || treatment.patient,
      doctor: treatment.doctorName || 'Self',
      items: billingItems,
      cash: dto.cash || 0,
      card: dto.card || 0,
      upi: dto.upi || 0,
      discount: totalDiscount,
      status: 'Completed',
      transactionType: 'Sale',
      note: sessionNotes,
    };

    const generatedBill = await this.billingService.generateBill(billPayload);

    // Update treatment session with bill info and mark Completed
    treatment.status = TreatmentStatus.Completed;
    treatment.billingStatus = TreatmentBillingStatus.Billed;
    treatment.bill = generatedBill._id as Types.ObjectId;
    treatment.billNo = generatedBill.mrn;
    treatment.paidAmount = (dto.cash || 0) + (dto.card || 0) + (dto.upi || 0);
    treatment.discount = totalDiscount;
    treatment.paymentMethod = dto.paymentMethod || 'Cash';
    treatment.completedAt = dto.completedAt || new Date();
    treatment.processedBy = userId || null;

    if (dto.therapist) {
      treatment.therapist = new mongoose.Types.ObjectId(dto.therapist);
    }
    if (dto.therapistName) {
      treatment.therapistName = dto.therapistName;
    }
    if (dto.notes) {
      treatment.notes = dto.notes;
    }

    const saved = await treatment.save();

    return {
      treatment: saved.toObject() as Treatment,
      bill: generatedBill,
    };
  }

  async repeatSession(
    id: string,
    dto: RepeatTreatmentDto,
    userId?: mongoose.Types.ObjectId,
  ): Promise<{ treatment: Treatment; bill?: any }> {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid treatment ID: ${id}`);
    }

    const original = await this.treatmentModel
      .findOne({ _id: id, isDeleted: { $ne: true } })
      .lean()
      .exec();

    if (!original) {
      throw new NotFoundException(`Treatment with id ${id} not found`);
    }

    const rootId = original.parentTreatment || original._id;

    // Determine next session number
    const count = await this.treatmentModel.countDocuments({
      $or: [{ _id: rootId }, { parentTreatment: rootId }],
      isDeleted: { $ne: true },
    });
    const nextSessionNumber = count + 1;

    // Retain previous therapist assignment by default or use new selection
    let therapistId = dto.therapist || original.therapist;
    let therapistName = dto.therapistName || original.therapistName;

    if (!therapistName || therapistName.trim() === '' || therapistName === '-') {
      const def = await this.getDefaultTherapist();
      therapistId = (def.therapist as any) || therapistId;
      therapistName = def.therapistName;
    }

    const mrn = await this.generateUniqueMRN();

    const itemsToUse =
      dto.items && dto.items.length > 0 ? dto.items : original.items;

    const formattedItems = (itemsToUse || []).map((item) => ({
      ...item,
      quantity: Number(item.quantity ?? 1),
      unitPrice: Number(item.unitPrice ?? 0),
      discount: Number(item.discount ?? 0),
      gst: Number(item.gst ?? 0),
      total: Number(
        item.total ??
          Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1) -
            Number(item.discount ?? 0),
      ),
    }));

    const newTreatment = new this.treatmentModel({
      mrn,
      patient: original.patient,
      doctor: original.doctor,
      doctorName: original.doctorName,
      consulting: original.consulting,
      type: original.type,
      category: original.category,
      items: formattedItems,
      therapist: therapistId,
      therapistName,
      status: TreatmentStatus.Pending,
      billingStatus: TreatmentBillingStatus.Unbilled,
      prescriptionDate: original.prescriptionDate || new Date(),
      treatmentDate: dto.treatmentDate || new Date(),
      notes: dto.notes || original.notes || '',
      sessionNumber: nextSessionNumber,
      parentTreatment: rootId,
      isRepeated: true,
      isDeleted: false,
    });

    const saved = await newTreatment.save();

    if (dto.autoProcess) {
      const processed = await this.processSession(
        String(saved._id),
        {
          cash: dto.cash,
          card: dto.card,
          upi: dto.upi,
          discount: dto.discount,
          paymentMethod: dto.paymentMethod,
          notes: dto.notes,
          therapist: dto.therapist,
          therapistName: dto.therapistName,
        },
        userId,
      );
      return {
        treatment: processed.treatment,
        bill: processed.bill,
      };
    }

    return {
      treatment: saved.toObject() as Treatment,
    };
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid treatment ID: ${id}`);
    }

    const treatment = await this.treatmentModel.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!treatment) {
      throw new NotFoundException(`Treatment with id ${id} not found`);
    }

    if (
      treatment.billingStatus === TreatmentBillingStatus.Billed ||
      treatment.status === TreatmentStatus.Completed
    ) {
      throw new BadRequestException(
        `Cannot delete a billed treatment session (Bill #${treatment.billNo}). Billed records cannot be deleted.`,
      );
    }

    treatment.isDeleted = true;
    await treatment.save();

    return { success: true, message: 'Treatment deleted successfully' };
  }
}
