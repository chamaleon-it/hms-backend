import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Appointment, AppointmentStatus } from './schemas/appointment.schema';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UsersService } from 'src/users/users.service';
import {
  InPatient,
  InPatientDocument,
  IPStatus,
} from '../in-patients/schemas/in-patient.schema';
import { BillingService } from 'src/billing/billing.service';
function getDoctorFirstNamePrefix(doctorName: string): string {
  if (!doctorName) return 'DOC';
  const cleanName = doctorName
    .replace(/^(Dr\.|Dr|Prof\.|Prof|Mr\.|Mr|Mrs\.|Mrs|Ms\.|Ms)\s+/i, '')
    .trim();
  const parts = cleanName.split(/[\s.]+/).filter(Boolean);
  const firstName = parts[0] || 'DOC';
  return firstName.toUpperCase();
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    @InjectModel(InPatient.name)
    private inPatientModel: Model<InPatientDocument>,
    private readonly usersService: UsersService,
    private readonly billingService: BillingService,
  ) {}

  async createAppointment(
    createAppointmentDto: CreateAppointmentDto,
    createdBy: mongoose.Types.ObjectId,
  ) {
    let shouldBillConsultation = true;

    try {
      // Find the most recent prior appointment for the same patient and doctor that had a consultation fee
      const lastAppointment = await this.appointmentModel
        .findOne({
          patient: createAppointmentDto.patient,
          doctor: createAppointmentDto.doctor,
          hasConsultationFee: { $ne: false },
          isDeleted: { $ne: true },
        })
        .sort({ date: -1 });

      if (lastAppointment) {
        const prevDate = new Date(lastAppointment.date);
        const validityEnd = new Date(prevDate);
        validityEnd.setDate(prevDate.getDate() + 10);
        validityEnd.setHours(23, 59, 59, 999);

        const newAppDate = new Date(createAppointmentDto.date);
        if (newAppDate <= validityEnd) {
          shouldBillConsultation = false;
        }
      }
    } catch (error) {
      console.error('Failed to look up last appointment:', error);
    }

    // Calculate Token for Doctor on Appointment Date
    let tokenNumber = 1;
    let token = 'DOC-01';

    try {
      const appDate = new Date(createAppointmentDto.date);
      const startOfDay = new Date(appDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(appDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const lastDoctorApp = await this.appointmentModel
        .findOne({
          doctor: createAppointmentDto.doctor,
          date: { $gte: startOfDay, $lte: endOfDay },
          isDeleted: { $ne: true },
        })
        .sort({ tokenNumber: -1, createdAt: -1 });

      if (
        lastDoctorApp &&
        typeof lastDoctorApp.tokenNumber === 'number' &&
        lastDoctorApp.tokenNumber > 0
      ) {
        tokenNumber = lastDoctorApp.tokenNumber + 1;
      } else {
        const existingCount = await this.appointmentModel.countDocuments({
          doctor: createAppointmentDto.doctor,
          date: { $gte: startOfDay, $lte: endOfDay },
          isDeleted: { $ne: true },
        });
        tokenNumber = existingCount + 1;
      }

      const doctorUser = await this.usersService.getUserById(
        createAppointmentDto.doctor,
      );
      const prefix = getDoctorFirstNamePrefix(doctorUser?.name || '');
      token = `${prefix}-${String(tokenNumber).padStart(2, '0')}`;
    } catch (tokenErr) {
      console.error('Failed to generate appointment token:', tokenErr);
    }

    const isWalkInApp = Boolean(
      (createAppointmentDto as any).isWalkIn ||
      (createAppointmentDto as any).walkIn ||
      createAppointmentDto.isArrived === true ||
      (createAppointmentDto.type as any) === 'Walk-in',
    );
    const isArrived = isWalkInApp
      ? true
      : (createAppointmentDto.isArrived ?? false);

    const appointment = await this.appointmentModel.create({
      ...createAppointmentDto,
      hasConsultationFee: shouldBillConsultation,
      tokenNumber,
      token,
      isArrived,
      createdBy,
    });

    try {
      if (shouldBillConsultation) {
        // Fetch the doctor from database to retrieve their consultation fee
        const doctorUser = await this.usersService.getUserById(
          appointment.doctor,
        );
        const consultationFee = doctorUser?.consultationFee ?? 0;

        // Construct a Draft bill containing the consultation fee
        const createBillingDto = {
          user: createdBy,
          patient: appointment.patient,
          doctor: appointment.doctor.toString(),
          token: appointment.token,
          tokenNumber: appointment.tokenNumber,
          items: [
            {
              name: 'Consultation Fee',
              quantity: 1,
              unitPrice: consultationFee,
              gst: 0,
              discount: 0,
              total: consultationFee,
            },
          ],
          cash: 0,
          card: 0,
          upi: 0,
          discount: 0,
          status: 'Draft',
        };

        await this.billingService.generateBill(createBillingDto);
      }
    } catch (error) {
      console.error(
        'Failed to create consultation fee bill for appointment:',
        error,
      );
    }

    return appointment;
  }

  async getAppointments({
    query,
    status,
    date,
    activeDate,
    doctor,
  }: {
    query?: string;
    status?: string[];
    date: string;
    activeDate: 'Today' | '7 days' | '30 days' | 'Custom';
    doctor?: string;
  }) {
    let dateStr = date || new Date().toISOString().split('T')[0];
    if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }

    let startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    let endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    if (isNaN(startOfDay.getTime())) {
      const todayStr = new Date().toISOString().split('T')[0];
      startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
      endOfDay = new Date(`${todayStr}T23:59:59.999Z`);
    }

    if (activeDate === 'Today') {
      const todayStr = new Date().toISOString().split('T')[0];
      startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
      endOfDay = new Date(`${todayStr}T23:59:59.999Z`);
    }
    if (activeDate === '7 days') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
      const endDateObj = new Date(today);
      endDateObj.setDate(today.getDate() + 7);
      const endStr = endDateObj.toISOString().split('T')[0];
      endOfDay = new Date(`${endStr}T23:59:59.999Z`);
    }
    if (activeDate === '30 days') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
      const endDateObj = new Date(today);
      endDateObj.setDate(today.getDate() + 30);
      const endStr = endDateObj.toISOString().split('T')[0];
      endOfDay = new Date(`${endStr}T23:59:59.999Z`);
    }

    const $match: Record<string, any> = {
      date: { $gte: startOfDay, $lte: endOfDay },
    };
    if (doctor && mongoose.isValidObjectId(doctor)) {
      $match.doctor = new mongoose.Types.ObjectId(doctor);
    }
    if (query && query.trim())
      $match.patientName = { $regex: new RegExp(safeRegex(query.trim()), 'i') };
    if (status?.length) {
      if (status.includes('Deleted')) {
        $match.isDeleted = true;
      } else {
        $match.isDeleted = false;
        $match.status = { $in: status };
      }
    }

    const list = await this.appointmentModel
      .aggregate([
        { $match },
        {
          $lookup: {
            from: 'users',
            localField: 'doctor',
            foreignField: '_id',
            pipeline: [
              {
                $project: {
                  name: 1,
                  email: 1,
                  phoneNumber: 1,
                  address: 1,
                  profilePic: 1,
                  qualification: 1,
                  specialization: 1,
                  department: 1,
                  designation: 1,
                  licenseNo: 1,
                  consultationFee: 1,
                },
              },
            ],
            as: 'doctor',
          },
        },
        { $unwind: { path: '$doctor', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'patients',
            localField: 'patient',
            foreignField: '_id',
            as: 'patient',
          },
        },
        { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'appointments',
            let: { pid: '$patient._id', curDate: '$date' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$patient', '$$pid'] },
                      { $lte: ['$date', '$$curDate'] },
                    ],
                  },
                },
              },
              { $count: 'cnt' },
            ],
            as: 'visitCountArr',
          },
        },
        {
          $addFields: {
            visitCount: { $ifNull: [{ $first: '$visitCountArr.cnt' }, 0] },
          },
        },
        { $project: { visitCountArr: 0 } },
        { $sort: { date: 1 } },
      ])
      .option({ allowDiskUse: true });

    const doctorCounters: Record<string, number> = {};
    return list
      .map((item: any) => {
        const docId = item.doctor?._id?.toString() || 'unknown';
        doctorCounters[docId] = (doctorCounters[docId] || 0) + 1;
        const num = item.tokenNumber || doctorCounters[docId];
        const docName = item.doctor?.name || '';
        const prefix = getDoctorFirstNamePrefix(docName);
        const tokenStr =
          item.token || `${prefix}-${String(num).padStart(2, '0')}`;
        return {
          ...item,
          tokenNumber: num,
          token: tokenStr,
        };
      })
      .sort((a: any, b: any) => (a.tokenNumber || 0) - (b.tokenNumber || 0));
  }

  async getStatistics(doctor?: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

    const matchCondition: Record<string, any> = {
      date: { $gte: startOfDay, $lte: endOfDay },
      isDeleted: false,
    };
    if (doctor && mongoose.isValidObjectId(doctor)) {
      matchCondition.doctor = new mongoose.Types.ObjectId(doctor);
    }

    const results: { count: number; _id: AppointmentStatus }[] =
      await this.appointmentModel.aggregate([
        {
          $match: matchCondition,
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

    const stats: Record<string, number> = {
      today: 0,
      upcoming: 0,
      consulted: 0,
      observation: 0,
      completed: 0,
      notShow: 0,
      test: 0,
      admit: 0,
    };

    stats.today = results.reduce((acc: number, r) => acc + r.count, 0);

    for (const r of results) {
      switch (r._id) {
        case AppointmentStatus.UPCOMING:
          stats.upcoming = r.count;
          break;
        case AppointmentStatus.CONSULTED:
          stats.consulted = r.count;
          break;
        case AppointmentStatus.OBSERVATION:
          stats.observation = r.count;
          break;
        case AppointmentStatus.COMPLETED:
          stats.completed = r.count;
          break;
        case AppointmentStatus.NOT_SHOW:
          stats.notShow = r.count;
          break;

        case AppointmentStatus.TEST:
          stats.test = r.count;
          break;

        case AppointmentStatus.ADMIT:
          stats.admit = r.count;
          break;
      }
    }

    return stats;
  }

  async calenderMonthly(date: string, doctor?: string) {
    let dateStr = date || new Date().toISOString().split('T')[0];
    if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }
    const parsedDate = new Date(`${dateStr}T00:00:00.000Z`);
    const now = !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();

    const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

    const filter: Record<string, any> = {
      date: { $gte: startDate, $lte: endDate },
      isDeleted: false,
    };
    if (doctor && mongoose.isValidObjectId(doctor)) {
      filter.doctor = new mongoose.Types.ObjectId(doctor);
    }

    const appointments = await this.appointmentModel
      .find(filter)
      .select('date patient type status')
      .sort({ date: 1 })
      .populate('patient', 'name mrn')
      .lean();

    const data = appointments.map((a) => ({
      ...a,
      date:
        a.date instanceof Date
          ? a.date.toISOString().split('T')[0]
          : new Date(a.date).toISOString().split('T')[0],
    }));

    return data;
  }

  async updateStatus(
    id: mongoose.Types.ObjectId,
    updateStatusDto: UpdateStatusDto,
  ) {
    const data = await this.appointmentModel.findByIdAndUpdate(
      id,
      { status: updateStatusDto.status },
      { new: true },
    );

    if (
      updateStatusDto.status === 'Observation' ||
      updateStatusDto.status === 'Admit'
    ) {
      const patientId = data?.patient;
      const doctorId = data?.doctor;

      if (patientId && doctorId) {
        const existingIP = await this.inPatientModel.findOne({
          patientId: patientId.toString(),
          status: { $ne: IPStatus.DISCHARGED },
        });

        if (!existingIP) {
          await this.inPatientModel.create({
            patientId: patientId.toString(),
            doctorId: doctorId.toString(),
            status:
              updateStatusDto.status === 'Observation'
                ? IPStatus.OBSERVATION
                : IPStatus.ADMITTED,
            admissionDate: new Date(),
          });
        }
      }
    }

    return data;
  }

  async getSingleAppointment(id: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id))
      throw new BadRequestException('id not valid');

    const data = await this.appointmentModel
      .findById(id)
      .lean()
      .populate('patient');
    if (!data) {
      throw new NotFoundException('Appointment is not found.');
    }
    return data;
  }

  async calenderWeekly(date: string, doctor?: string) {
    let now = new Date();
    if (date) {
      const parsed = new Date(date.includes('T') ? date : `${date}T00:00:00.000Z`);
      if (!isNaN(parsed.getTime())) {
        now = parsed;
      }
    }
    const startOfWeek = new Date(now);
    startOfWeek.setUTCDate(now.getUTCDate() - now.getUTCDay());
    startOfWeek.setUTCHours(0, 0, 0, 0);

    const endOfWeek = new Date(now);
    endOfWeek.setUTCDate(now.getUTCDate() + (6 - now.getUTCDay()));
    endOfWeek.setUTCHours(23, 59, 59, 999);

    const filter: Record<string, any> = {
      date: { $gte: startOfWeek, $lte: endOfWeek },
      isDeleted: false,
    };
    if (doctor && mongoose.isValidObjectId(doctor)) {
      filter.doctor = new mongoose.Types.ObjectId(doctor);
    }

    const data = await this.appointmentModel
      .find(filter)
      .select('date endDate patient doctor type status visitCount notes method token tokenNumber')
      .populate('patient', 'name mrn')
      .populate('doctor', 'name')
      .lean();

    return data;
  }

  async getBookedSlot(date: Date | string, doctor?: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(doctor))
      throw new BadRequestException(
        'Doctor id is not valid, Please select a valid doctor id',
      );

    let dateStr = typeof date === 'string' ? date : date.toISOString();
    if (dateStr.includes('T')) {
      dateStr = dateStr.split('T')[0];
    }
    const startOfDay = new Date(
      Math.min(
        new Date(`${dateStr}T00:00:00.000Z`).getTime(),
        new Date(`${dateStr}T00:00:00.000+05:30`).getTime(),
      ),
    );
    const endOfDay = new Date(
      Math.max(
        new Date(`${dateStr}T23:59:59.999Z`).getTime(),
        new Date(`${dateStr}T23:59:59.999+05:30`).getTime(),
      ),
    );

    const $match: Record<string, any> = {
      date: { $gte: startOfDay, $lte: endOfDay },
      doctor,
      isDeleted: { $ne: true },
      status: { $nin: ['Cancelled', 'Canceled'] },
    };

    const data = await this.appointmentModel
      .find($match)
      .distinct('date')
      .lean();

    return data;
  }

  async getPatientAppointment(patient: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(patient)) {
      throw new BadRequestException('Please provide a valid patient id');
    }
    const data = await this.appointmentModel
      .find({ patient })
      .populate('patient')
      .populate('doctor', 'name specialization')
      .sort({ date: -1 })
      .lean();
    return data;
  }

  async getWalkInAppointment(doctor: mongoose.Types.ObjectId, date: string) {
    if (!mongoose.isValidObjectId(doctor))
      throw new BadRequestException('Please provide a valid doctor id');
    const today = date ? new Date(date) : new Date();

    const availability: mongoose.FlattenMaps<{
      startDate?: (Date | null) | undefined;
      endDate?: (Date | null) | undefined;
      startTime?: string | null | undefined;
      endTime?: string | null | undefined;
      days?: string[] | undefined;
      rounds?:
        | {
            label?: string | undefined;
            start?: string | undefined;
            end?: string | undefined;
          }[]
        | undefined;
    }> = await this.usersService.getDoctorAvailability(doctor);

    const isAvailable = availability.days
      ?.map((d) => dayNameToIndex[d])
      ?.includes(today.getDay());

    if (isAvailable) {
      const alreadyBooked: Date[] = await this.getBookedSlot(
        new Date(),
        doctor,
      );

      return {
        alreadyBooked,
        nextAvailableDate: today,
      };
    } else {
      const nextAvailableDate = getNextAvailableDate(
        availability.days ?? [],
        today,
      );
      const alreadyBooked: Date[] = await this.getBookedSlot(
        nextAvailableDate,
        doctor,
      );
      return {
        alreadyBooked,
        nextAvailableDate,
      };
    }
  }

  async updateAppointment(
    createAppointmentDto: CreateAppointmentDto,
    id: mongoose.Types.ObjectId,
  ) {
    const data = await this.appointmentModel.findByIdAndUpdate(
      id,
      createAppointmentDto,
      { new: true },
    );
    if (!data) {
      throw new BadRequestException('No appointment found');
    }
    return data;
  }

  async deleteAppointment(id: mongoose.Types.ObjectId) {
    const data = await this.appointmentModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );
    if (!data) {
      throw new BadRequestException('No appointment found');
    }
    return data;
  }

  async recoverAppointment(id: mongoose.Types.ObjectId) {
    const data = await this.appointmentModel.findByIdAndUpdate(
      id,
      { isDeleted: false },
      { new: true },
    );
    if (!data) {
      throw new BadRequestException('No appointment found');
    }
    return data;
  }

  async refundAppointment(
    id: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    reason?: string,
  ) {
    const appointment = await this.appointmentModel.findById(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    if (appointment.isRefunded) {
      throw new BadRequestException(
        'This appointment has already been refunded',
      );
    }

    const doctorUser = await this.usersService.getUserById(appointment.doctor);
    const consultationFee = doctorUser?.consultationFee ?? 0;

    const refundBill = await this.billingService.generateBill({
      user: userId,
      patient: appointment.patient,
      doctor: appointment.doctor.toString(),
      items: [
        {
          name: 'Consultation Fee Refund',
          quantity: 1,
          unitPrice: consultationFee,
          gst: 0,
          discount: 0,
          total: consultationFee,
        },
      ],
      cash: consultationFee,
      card: 0,
      upi: 0,
      discount: 0,
      transactionType: 'Refund',
      status: 'Completed',
      note: reason || undefined,
    } as any);

    appointment.isRefunded = true;
    if (reason) appointment.refundReason = reason;
    await appointment.save();

    return {
      appointment,
      bill: refundBill,
    };
  }

  async markArrived(id: mongoose.Types.ObjectId) {
    const appointment = await this.appointmentModel.findByIdAndUpdate(
      id,
      { isArrived: true },
      { new: true },
    );
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }
}

export function safeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const dayNameToIndex: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getNextAvailableDate(
  availableDays: string[],
  today: Date = new Date(),
): Date {
  const todayIndex = today.getDay();
  const availableIndices = availableDays.map((d) => dayNameToIndex[d]);

  const daysToAdd =
    availableIndices
      .map((day) => (day - todayIndex + 7) % 7)
      .filter((diff) => diff > 0)
      .sort((a, b) => a - b)[0] ?? 7;

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysToAdd);

  return nextDate;
}
