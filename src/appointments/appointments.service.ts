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

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
  ) {}

  async createAppointment(
    createAppointmentDto: CreateAppointmentDto,
    createdBy: mongoose.Types.ObjectId,
  ) {
    const appointment = await this.appointmentModel.create({
      ...createAppointmentDto,
      createdBy,
    });

    return appointment;
  }

  async getAppointments({
    query,
    status,
    date,
  }: {
    query?: string;
    status?: string[];
    date: string;
  }) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const $match: Record<string, any> = {
      date: { $gte: startOfDay, $lte: endOfDay },
    };
    if (query && query.trim())
      $match.patientName = { $regex: new RegExp(safeRegex(query.trim()), 'i') };
    if (status?.length) $match.status = { $in: status };

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
            let: { pid: '$patient._id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$patient', '$$pid'] } } },
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

    const results = await this.appointmentModel.aggregate([
      {
        $match: {
          date: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Create default counts with 0
    const stats = {
      today: 0,
      upcoming: 0,
      consulted: 0,
      observation: 0,
      completed: 0,
      notShow: 0,
      test: 0,
      admit: 0,
    };

    // Total count for today
    stats.today = results.reduce((acc, r) => acc + r.count, 0);

    // Fill individual statuses
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
    const now = new Date(date);
    const year = now.getFullYear();
    const month = now.getMonth(); // 0 = Jan

    // Get start & end of current month
    const startDate = new Date(year, month, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Fetch filtered appointments
    const appointments = await this.appointmentModel
      .find({
        date: { $gte: startDate, $lte: endDate },
      })
      .select('date patientName type status')
      .sort({ date: 1 })
      .populate('patient')
      .lean(); // returns plain JS objects (faster + easier to format)

    // Format date to "YYYY-MM-DD"
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
    // Get start (Sunday) and end (Saturday) of current week
    const now = new Date(date);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (6 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    // Fetch only required fields & filter in DB (not in JS)
    const data = await this.appointmentModel
      .find({
        date: { $gte: startOfWeek, $lte: endOfWeek },
      })
      .select('date status')
      .populate('patient', 'name')
      .lean();

    // Map formatted response
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
}

export function safeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
