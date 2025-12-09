import { Types } from 'mongoose';
import { ReportStatus, SampleType } from 'src/lab/report/schemas/report.schema';

export class CreateReportDto {
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  lab?: Types.ObjectId;
  date: Date;
  priority: string;
  panels: string[];
  name: {
    code: string;
    max?: number;
    min?: number;
    name: string;
    type: 'Lab' | 'Imaging';
    panel: string;
    unit: string;
    _id?: Types.ObjectId | undefined;
  }[];
  sampleType: SampleType;
  status: ReportStatus;
}
