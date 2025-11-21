import mongoose from 'mongoose';
import { ReportStatus } from 'src/lab/schemas/report.schema';

export class GetReportDto {
  type?: 'Lab' | 'Imaging';
  status?: ReportStatus;
  q?: string;
  doctor?: mongoose.Types.ObjectId;
  lab?: mongoose.Types.ObjectId;
}
