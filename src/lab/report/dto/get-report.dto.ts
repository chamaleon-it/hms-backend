import mongoose from 'mongoose';
import { ReportStatus } from 'src/lab/report/schemas/report.schema';

export class GetReportDto {
  type?: 'Lab' | 'Imaging';
  status?: ReportStatus | 'Flagged';
  q?: string;
  doctor?: mongoose.Types.ObjectId;
  lab?: mongoose.Types.ObjectId;
}
