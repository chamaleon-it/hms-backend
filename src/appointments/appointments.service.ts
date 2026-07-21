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
import { InPatient, InPatientDocument, IPStatus } from '../in-patients/schemas/in-patient.schema';
import { BillingService } from 'src/billing/billing.service';
@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    @InjectModel(InPatient.name) private inPatientModel: Model<InPatientDocument>,
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
      const lastAppointment = await this.appointmentModel.findOne({
        patient: createAppointmentDto.patient,
        doctor: createAppointmentDto.doctor,
        hasConsultationFee: { $ne: false },
        isDeleted: { $ne: true },
      }).sort({ date: -1 });

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

    const appointment = await this.appointmentModel.create({
      ...createAppointmentDto,
      hasConsultationFee: shouldBillConsultation,
      createdBy,
    });

    try {
      if (shouldBillConsultation) {
        // Fetch the doctor from database to retrieve their consultation fee
        const doctorUser = await this.usersService.getUserById(appointment.doctor);
        const consultationFee = doctorUser?.consultationFee ?? 0;

        // Construct a Draft bill containing the consultation fee
        const createBillingDto = {
          user: createdBy,
          patient: appointment.patient,
          doctor: appointment.doctor.toString(),
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

        await this.billingService.generateBill(createBillingDto as any);
      }
    } catch (error) {
      console.error('Failed to create consultation fee bill for appointment:', error);
    }

    return appointment;
  }

  async getAppointments({
    query,
    status,
    date,
    activeDate,
  }: {
    query?: string;
    status?: string[];
    date: string;
    activeDate: 'Today' | '7 days' | '30 days' | 'Custom';
  }) {
    let startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    let endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    if (activeDate === 'Today') {
      const today = new Date();
      startOfDay = new Date(today.setHours(0, 0, 0, 0));
      endOfDay = new Date(today.setHours(23, 59, 59, 999));
    }
    if (activeDate === '7 days') {
      const today = new Date();
      startOfDay = new Date(today.setHours(0, 0, 0, 0));
      endOfDay = new Date(today.setDate(today.getDate() + 7));
      endOfDay.setHours(23, 59, 59, 999);
    }
    if (activeDate === '30 days') {
      const today = new Date();
      startOfDay = new Date(today.setHours(0, 0, 0, 0));
      endOfDay = new Date(today.setDate(today.getDate() + 30));
      endOfDay.setHours(23, 59, 59, 999);
    }

    const $match: Record<string, any> = {
      date: { $gte: startOfDay, $lte: endOfDay },
    };
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

    return this.appointmentModel
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
  }

  async getStatistics() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const results: { count: number; _id: AppointmentStatus }[] =
      await this.appointmentModel.aggregate([
        {
          $match: {
            date: { $gte: startOfDay, $lte: endOfDay },
            isDeleted: false,
          },
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

  async calenderMonthly(date: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const startDate = new Date(year, month, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const appointments = await this.appointmentModel
      .find({
        date: { $gte: startDate, $lte: endDate },
        isDeleted: false,
      })
      .select('date patientName type status')
      .sort({ date: 1 })
      .populate('patient')
      .lean();

    const data = appointments.map((a) => ({
      ...a,
      date: a.date.toISOString().split('T')[0],
    }));

    return data;
  }

  async updateStatus(
    id: mongoose.Types.ObjectId,
    updateStatusDto: UpdateStatusDto,
  ) {
    if (!mongoose.isValidObjectId(id))
      throw new BadRequestException('id not valid');

    const data = await this.appointmentModel.findByIdAndUpdate(
      id,
      { status: updateStatusDto.status },
      { new: true, runValidators: true },
    );

    if (!data) {
      throw new NotFoundException('Appointment not found');
    }

    if (updateStatusDto.status === 'Admit' || updateStatusDto.status === 'Observation') {
      const activeIP = await this.inPatientModel.findOne({
        patientId: data.patient,
        status: { $ne: IPStatus.DISCHARGED }
      });

      if (!activeIP) {
        const admissionNumber = 'IP-' + Math.floor(100000 + Math.random() * 900000);
        await this.inPatientModel.create({
          patientId: data.patient,
          doctorId: data.doctor,
          admissionNumber,
          room: 'TBD',
          ward: 'TBD',
          bed: 'TBD',
          status: updateStatusDto.status === 'Observation' ? IPStatus.OBSERVATION : IPStatus.ADMITTED,
          admissionDate: new Date(),
        });
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

  async calenderWeekly(date: string) {
    const now = new Date(date);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (6 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    const data = await this.appointmentModel
      .find({
        date: { $gte: startOfWeek, $lte: endOfWeek },
        isDeleted: false,
      })
      .select('date status')
      .populate('patient', 'name')
      .lean();

    return data;
  }

  async getBookedSlot(date: Date, doctor?: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(doctor))
      throw new BadRequestException(
        'Doctor id is not valid, Please selected valid doctor id',
      );

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const $match: Record<string, any> = {
      date: { $gte: startOfDay, $lte: endOfDay },
      doctor,
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

  async refundAppointment(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId, reason?: string) {
    const appointment = await this.appointmentModel.findById(id);
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    if (appointment.isRefunded) {
      throw new BadRequestException('This appointment has already been refunded');
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
