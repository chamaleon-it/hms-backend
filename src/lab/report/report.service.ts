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

  async getReport(
    user: mongoose.Types.ObjectId,
    // dto: GetReportDto
  ) {
    const match: {
      $or?: Record<string, mongoose.Types.ObjectId>[];
      isDeleted?: boolean
    } = {
      $or: [{ doctor: user }, { lab: user }, { patient: user }],
    };

    match.isDeleted = false

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
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return data;
  }

  async updateResult(dto: ResultDto) {
    const { _id, test } = dto;

    const report = await this.reportModel.findById(_id);
    if (!report) throw new NotFoundException('Report not found');

    test.forEach((n) => {
      const index = report.test.findIndex(
        (x) => x.name.toString() === n.name._id.toString(),
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

  async sampleCollected(id: mongoose.Types.ObjectId) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    data.status = ReportStatus.SAMPLE_COLLECTED;
    data.sampleCollectedAt = new Date();
    await data.save();
    return data;
  }

  async startTest(id: mongoose.Types.ObjectId) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    data.status = ReportStatus.WAITING_FOR_RESULT;
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
}
