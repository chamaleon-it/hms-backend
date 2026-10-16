import mongoose, { Types } from 'mongoose';
import { ReportStatus } from 'src/lab/report/schemas/report.schema';

export class CreateReportDto {
  patient: Types.ObjectId;
  doctor: Types.ObjectId | null;
  doctorName?: string;
  lab?: Types.ObjectId;
  date: Date;
  priority: string;
  panels?: string[];
  groups?: string[];
  test: {
    name: mongoose.Types.ObjectId;
    value?: string | number;
  }[];
  sampleType: string;
  status: ReportStatus;
  technician?: string;
  discount?: number;
}
