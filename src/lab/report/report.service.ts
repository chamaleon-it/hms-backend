import { Body, Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Report } from '../schemas/report.schema';

@Injectable()
export class ReportService {
  constructor(@InjectModel(Report.name) private reportModel: Model<Report>) {}
  async createReport(@Body() dto: CreateReportDto) {
    const data = await this.reportModel.create(dto);
    return data;
  }

  async getReport(user: mongoose.Types.ObjectId) {
    const data = await this.reportModel
      .find({
        $or: [{ doctor: user }, { lab: user }, { patient: user }],
      })
      .populate('doctor', 'name specialization')
      .populate('lab', 'name specialization')
      .populate('patient');

    return data;
  }
}
