import { Injectable } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Appointment, AppointmentStatus } from './schemas/appointment.schema';
import { GetListDto } from './dto/get-list.dto';

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
  }: {
    query?: string;
    status?: string[];
  }) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let filter: { patientName?: RegExp; date: {}; status?: {} } = {
      date: { $gte: startOfDay, $lte: endOfDay },
    };

    if (query && query.trim()) {
      // case-insensitive, prefix/contains match (safe from regex DOS)
      const rx = new RegExp(safeRegex(query.trim()), 'i');
      filter.patientName = rx;
    }

    if (status?.length) {
      filter.status = { $in: status };
    }

    const data = await this.appointmentModel
      .find(filter)
      .populate('doctor', 'name email phoneNumber address profilePic')
      .sort({ date: 1 });
    return data;
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
      }
    }

    return stats;
  }

  async calenderMonthly() {
    const now = new Date();
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
      .lean(); // returns plain JS objects (faster + easier to format)

    // Format date to "YYYY-MM-DD"
    const data = appointments.map((a) => ({
      ...a,
      date: a.date.toISOString().split('T')[0],
    }));

    return data;
  }
}

export function safeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
