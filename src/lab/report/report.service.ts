import { Body, Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Report } from '../schemas/report.schema';
import { GetReportDto } from './dto/get-report.dto';

@Injectable()
export class ReportService {
  constructor(@InjectModel(Report.name) private reportModel: Model<Report>) {}
  async createReport(@Body() dto: CreateReportDto) {
    const data = await this.reportModel.create(dto);
    return data;
  }

  async getReport(user: mongoose.Types.ObjectId, dto: GetReportDto) {
    const { doctor, lab, q, status, type } = dto;

    const match: any = {
      $or: [{ doctor: user }, { lab: user }, { patient: user }],
    };

    // if (doctor) {
    //   match.doctor = doctor;
    // }

    // if (lab) {
    //   match.lab = lab;
    // }
    // if (status) {
    //   match.status = status;
    // }
    // if (type) {
    //   match.name.type = type;
    // }

    // console.log(match);

    const data = await this.reportModel
      .find(match)
      .populate('doctor', 'name specialization')
      .populate('lab', 'name specialization')
      .populate('patient').sort({createdAt:-1}).lean().exec();

    return data;
  }
}
