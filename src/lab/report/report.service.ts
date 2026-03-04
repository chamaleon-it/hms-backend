import {
  BadRequestException,
  Body,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Report, ReportStatus } from './schemas/report.schema';
// import { GetReportDto } from './dto/get-report.dto';
import configuration from 'src/config/configuration';
import { ResultDto } from './dto/result.dto';
import { SampleCollectedDto } from './dto/sample-collected.dto';
import { GetReportDto } from './dto/get-report.dto';

@Injectable()
export class ReportService {
  constructor(@InjectModel(Report.name) private reportModel: Model<Report>) { }
  async createReport(@Body() dto: CreateReportDto) {
    if (!dto.lab) {
      dto.lab = new mongoose.Types.ObjectId(configuration().in_house_lab_id);
    }
    const userReport = await this.reportModel.findOne({
      patient: dto.patient,
      status: ReportStatus.UPCOMING,
      lab: dto.lab,
      isDeleted: false,
    });

    if (!userReport) {
      const data = await this.reportModel.create(dto);
      return data;
    } else {
      userReport.test.push(
        ...dto.test
          .filter(
            (t) =>
              !userReport.test.some(
                (existing) => existing.name.toString() === t.name.toString(),
              ),
          )
          .map((t) => ({ name: t.name, value: t.value ?? '' })),
      );

      if (dto.panels && dto.panels.length > 0) {
        userReport.panels.push(
          ...dto.panels.filter(
            (p) =>
              !userReport.panels.some(
                (existing) => existing.toString() === p.toString(),
              ),
          ),
        );
      }
      await userReport.save();
      return userReport;
    }
  }

  async getReport(user: mongoose.Types.ObjectId, dto: GetReportDto) {
    const match: any = {
      $or: [{ doctor: user }, { lab: user }, { patient: user }],
    };

    match.isDeleted = false;

    if (dto.status) {
      if (dto.status === 'Flagged') {
        match.isFlagged = true;
      } else if (dto.status === "Deleted") {
        match.isDeleted = true;
      }
      else {
        match.status = dto.status;
      }
    }



    const data = await this.reportModel
      .find(match)
      .populate('doctor', 'name specialization')
      .populate('lab', 'name specialization')
      .populate('patient')
      .populate({
        path: 'test.name',
        populate: {
          path: 'panels',
        },
      })
      // .sort({ createdAt: -1 })
      .lean()
      .exec();

    return data;
  }

  async updateResult(dto: ResultDto) {
    const { _id, test } = dto;

    const report = await this.reportModel.findById(_id);
    if (!report) throw new NotFoundException('Report not found');

    test.forEach((n) => {
      if (!n?.name?._id) return;

      const index = report.test.findIndex(
        (x) => x?.name?.toString() === n.name._id.toString(),
      );
      if (index !== -1) {
        report.test[index].value = n.value;
      }
    });

    const allFilled = report.test.every((item) => {
      return (
        item.value !== null && item.value !== '' && item.value !== undefined
      );
    });

    report.status = allFilled
      ? ReportStatus.COMPLETED
      : ReportStatus.WAITING_FOR_RESULT;

    await report.save();

    return { message: 'Updated successfully' };
  }

  async getPatientReports(patient: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(patient))
      throw new BadRequestException('Please provide a valid patient id.');
    const report = await this.reportModel
      .find({ patient, isDeleted: false })
      .populate('doctor', 'name specialization')
      .populate('lab', 'name')
      .populate('test.name')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return report;
  }

  async getPatients() {
    type PatientOut = {
      _id: mongoose.Types.ObjectId;
      name?: string;
      phoneNumber?: string;
      gender?: string;
      dateOfBirth?: Date;
      address?: string;
      mrn?: string;
      createdAt?: Date;
      visits: number;
      lastVisit?: Date;
    };

    const patients: PatientOut[] = await this.reportModel
      .aggregate([
        {
          $match: {
            patient: { $exists: true, $ne: null },
            isDeleted: false,
          },
        },

        {
          $group: {
            _id: '$patient',
            visits: { $sum: 1 },
            lastVisit: { $max: '$createdAt' },
          },
        },

        {
          $lookup: {
            from: 'patients',
            localField: '_id',
            foreignField: '_id',
            as: 'patient',
          },
        },

        { $unwind: { path: '$patient', preserveNullAndEmptyArrays: false } },

        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                '$patient',
                { visits: '$visits', lastVisit: '$lastVisit' },
              ],
            },
          },
        },

        {
          $project: {
            name: 1,
            address: 1,
            mrn: 1,
            dateOfBirth: 1,
            gender: 1,
            phoneNumber: 1,
            createdAt: 1,
            visits: 1,
            lastVisit: 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .exec();

    return patients;
  }

  async sampleCollected(id: mongoose.Types.ObjectId, dto: SampleCollectedDto) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    data.status = ReportStatus.SAMPLE_COLLECTED;
    data.sampleCollectedAt = new Date();
    data.sampleId = dto.sampleId;
    await data.save();
    return data;
  }

  async startTest(id: mongoose.Types.ObjectId) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    data.status = ReportStatus.WAITING_FOR_RESULT;
    data.testStartedAt = new Date();
    await data.save();
    return data;
  }

  async deleteReport(id: mongoose.Types.ObjectId) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    data.isDeleted = true;
    await data.save();
    return data;
  }

  async markAsFlagged(id: mongoose.Types.ObjectId) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    data.isFlagged = true;
    await data.save();
    return data;
  }

  async markAsUnflagged(id: mongoose.Types.ObjectId) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    data.isFlagged = false;
    await data.save();
    return data;
  }

  async getStatistics() {
    const data = await this.reportModel.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          upcoming: {
            $sum: {
              $cond: {
                if: { $eq: ['$status', ReportStatus.UPCOMING] },
                then: 1,
                else: 0,
              },
            },
          },
          sampleCollected: {
            $sum: {
              $cond: {
                if: { $eq: ['$status', ReportStatus.SAMPLE_COLLECTED] },
                then: 1,
                else: 0,
              },
            },
          },
          waitingForResult: {
            $sum: {
              $cond: {
                if: { $eq: ['$status', ReportStatus.WAITING_FOR_RESULT] },
                then: 1,
                else: 0,
              },
            },
          },
          completed: {
            $sum: {
              $cond: {
                if: { $eq: ['$status', ReportStatus.COMPLETED] },
                then: 1,
                else: 0,
              },
            },
          },
          flagged: {
            $sum: {
              $cond: {
                if: { $eq: ['$isFlagged', true] },
                then: 1,
                else: 0,
              },
            },
          },
        },
      },
    ]);
    return data[0];
  }

  async resetTimer(id: mongoose.Types.ObjectId, dto: { duration: number }) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    data.extraTime = data.extraTime + dto.duration;
    await data.save();
    return data;
  }

  async recoverReport(id: mongoose.Types.ObjectId) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    data.isDeleted = false;
    await data.save();
    return data;
  }

  async updateReport(id: mongoose.Types.ObjectId, dto: CreateReportDto) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }

    if (dto.test) {
      data.test = dto.test.map((t) => ({ name: t.name, value: t.value ?? '' })) as any;
    }
    if (dto.panels) {
      data.panels = dto.panels;
    }
    if (dto.priority) {
      data.priority = dto.priority;
    }
    if (dto.date) {
      data.date = dto.date;
    }

    await data.save();
    return data;
  }

  async repeatReport(id: mongoose.Types.ObjectId) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    const newReport = await this.createReport({ date: new Date(), doctor: data.doctor, panels: data.panels, test: data.test, patient: data.patient, priority: data.priority, sampleType: data.sampleType, status: ReportStatus.UPCOMING, lab: data.lab })
    return newReport;
  }
}
