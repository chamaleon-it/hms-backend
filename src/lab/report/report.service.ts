import { Body, Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Report } from '../schemas/report.schema';
import { GetReportDto } from './dto/get-report.dto';
import configuration from 'src/config/configuration';

@Injectable()
export class ReportService {
  constructor(@InjectModel(Report.name) private reportModel: Model<Report>) {}
  async createReport(@Body() dto: CreateReportDto) {
    if(!dto.lab){
      dto.lab = new mongoose.Types.ObjectId(configuration().in_house_lab_id)
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
}
