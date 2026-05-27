import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './schemas/report.schema';
import { Test, TestSchema } from '../panels/schemas/test.schema';
import { Patient, PatientSchema } from '../../patients/schemas/patient.schema';
import { Panel, PanelSchema } from '../panels/schemas/panel.schema';
import { BillingModule } from '../../billing/billing.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: Test.name, schema: TestSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: Panel.name, schema: PanelSchema },
    ]),
    BillingModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
