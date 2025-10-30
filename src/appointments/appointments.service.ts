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

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
    private readonly usersService: UsersService,
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

    stats.today = results.reduce((acc, r) => acc + r.count, 0);

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
    const month = now.getMonth();

    const startDate = new Date(year, month, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const appointments = await this.appointmentModel
      .find({
        date: { $gte: startDate, $lte: endDate },
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


  async updateAppointment(createAppointmentDto: CreateAppointmentDto,id:mongoose.Types.ObjectId){
    const data = await this.appointmentModel.findByIdAndUpdate(id,createAppointmentDto,{new:true})
    if(!data){
      throw new BadRequestException("No appointment found")
    }
    return data
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
