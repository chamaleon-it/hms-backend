import mongoose, { Types } from 'mongoose';
import { ReportStatus, REPORT_PRIORITIES } from 'src/lab/report/schemas/report.schema';
import { IsIn, IsOptional } from 'class-validator';

export class CreateReportDto {
  patient: Types.ObjectId;
  doctor: Types.ObjectId | null;
  lab?: Types.ObjectId;
  date: Date;
  @IsOptional()
  @IsIn(REPORT_PRIORITIES)
  priority?: string;
  panels?: string[];
  groups?: string[];
  test: {
    name: mongoose.Types.ObjectId;
    value?: string | number;
  }[];
  sampleType: string;
  status: ReportStatus;
  technician?: string;
}
