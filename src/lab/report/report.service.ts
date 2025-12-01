import { Body, Injectable, NotFoundException } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Report, ReportStatus } from '../schemas/report.schema';
import { GetReportDto } from './dto/get-report.dto';
import configuration from 'src/config/configuration';
import { ResultDto } from './dto/result.dto';

@Injectable()
export class ReportService {
  constructor(@InjectModel(Report.name) private reportModel: Model<Report>) {}
  async createReport(@Body() dto: CreateReportDto) {
    if (!dto.lab) {
      dto.lab = new mongoose.Types.ObjectId(configuration().in_house_lab_id);
    }
    const data = await this.reportModel.create(dto);
    return data;
  }

  async getReport(user: mongoose.Types.ObjectId, dto: GetReportDto) {
    const match: any = {
      $or: [{ doctor: user }, { lab: user }, { patient: user }],
    };

    const data = await this.reportModel
      .find(match)
      .populate('doctor', 'name specialization')
      .populate('lab', 'name specialization')
      .populate('patient')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return data;

    console.log(dto);
  }

  async updateResult(dto: ResultDto) {
    const { _id, name } = dto;

    const report = await this.reportModel.findById(_id);
    if (!report) throw new NotFoundException('Report not found');

    name.forEach((n) => {
      const index = report.name.findIndex((x) => x._id.toString() === n._id);
      if (index !== -1) {
        report.name[index].value = n.value;
      }
    });

     const allFilled = report.name.every((item) => {
    return item.value !== null && item.value !== "" && item.value !== undefined;
  });

  report.status = allFilled
    ? ReportStatus.COMPLETED
    : ReportStatus.IN_PROGRESS;


    await report.save();

    return { message: 'Updated successfully' };
  }
}
