import mongoose, { Types } from 'mongoose';
import { ReportStatus, SampleType } from 'src/lab/report/schemas/report.schema';

export class CreateReportDto {
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  lab?: Types.ObjectId;
  date: Date;
  priority: string;
  panels?: string[];
  test: {
    name: mongoose.Types.ObjectId;
    value?: string | number;
  }[];
  sampleType: SampleType;
  status: ReportStatus;
}
