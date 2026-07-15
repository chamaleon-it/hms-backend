import {
  BadRequestException,
  Body,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Report, ReportStatus } from './schemas/report.schema';
// import { GetReportDto } from './dto/get-report.dto';
import configuration from 'src/config/configuration';
import { ResultDto } from './dto/result.dto';
import { SampleCollectedDto } from './dto/sample-collected.dto';
import { GetReportDto } from './dto/get-report.dto';
import { GetLabPatientsDto } from './dto/get-lab-patients.dto';
import { LisResultDto } from './dto/lis-result.dto';
import { Test } from '../panels/schemas/test.schema';
import { Patient, PatientStatus } from '../../patients/schemas/patient.schema';
import { async } from 'rxjs';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel(Test.name) private testModel: Model<Test>,
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
  ) {}
  async createReport(@Body() dto: CreateReportDto) {
    if (!dto.lab) {
      dto.lab = new mongoose.Types.ObjectId(configuration().in_house_lab_id);
    }
    const startOfDay = new Date(dto.date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(dto.date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const userReport = await this.reportModel.findOne({
      patient: dto.patient,
      status: ReportStatus.UPCOMING,
      lab: dto.lab,
      date: { $gte: startOfDay, $lte: endOfDay },
      isDeleted: false,
    });

    if (!userReport) {
      const data = await this.reportModel.create(dto);
      return data;
    } else {
      userReport.test.push(
        ...dto.test
          .filter(
            (t) =>
              !userReport.test.some(
                (existing) => existing.name.toString() === t.name.toString(),
              ),
          )
          .map((t) => ({ name: t.name, value: t.value ?? '' })),
      );

      if (dto.panels && dto.panels.length > 0) {
        userReport.panels.push(
          ...dto.panels.filter(
            (p) =>
              !userReport.panels.some(
                (existing) => existing.toString() === p.toString(),
              ),
          ),
        );
      }
      await userReport.save();
      return userReport;
    }
  }

  async getReport(user: mongoose.Types.ObjectId, dto: GetReportDto) {
    const match: any = {
      $or: [{ doctor: user }, { lab: user }, { patient: user }],
    };

    match.isDeleted = false;

    if (dto.status) {
      if (dto.status === 'Flagged') {
        match.isFlagged = true;
      } else if (dto.status === 'Deleted') {
        match.isDeleted = true;
      } else {
        match.status = dto.status;
      }
    }

    if (dto.startDate && dto.endDate) {
      match.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      };
    }

    const data = await this.reportModel
      .find(match)
      .populate('doctor', 'name specialization')
      .populate('lab', 'name specialization')
      .populate('patient')
      .populate({
        path: 'test.name',
        populate: {
          path: 'panels',
          populate: {
            path: 'tests',
            select: 'name',
          },
        },
      })
      // .sort({ createdAt: -1 })
      .lean()
      .exec();

    return data;
  }

  async updateResult(dto: ResultDto) {
    const { _id, test, collectedDate, reportedDate } = dto;

    const report = await this.reportModel.findById(_id);
    if (!report) throw new NotFoundException('Report not found');

    test.forEach((n) => {
      if (!n?.name?._id) return;

      const index = report.test.findIndex(
        (x) => x?.name?.toString() === n.name._id.toString(),
      );
      if (index !== -1) {
        report.test[index].value = n.value;
      }
    });

    const allFilled = report.test.every((item) => {
      return (
        item.value !== null && item.value !== '' && item.value !== undefined
      );
    });

    report.status = allFilled
      ? ReportStatus.COMPLETED
      : ReportStatus.WAITING_FOR_RESULT;

    await report.save();

    // Forcefully override locked timestamp behavior directly in Mongo
    if (collectedDate || reportedDate) {
      const updateData: any = {};
      if (collectedDate) updateData.sampleCollectedAt = new Date(collectedDate);
      if (reportedDate) updateData.testStartedAt = new Date(reportedDate);
      await this.reportModel.updateOne(
        { _id: report._id },
        { $set: updateData },
        { timestamps: false, strict: false },
      );
    }

    return { message: 'Updated successfully' };
  }

  async updateFromLis(dto: LisResultDto) {
    const { sampleId, patientId, machine, results, graphs } = dto;

    // Use a regex to allow matching "004" to "004 (Blood)" safely in Mongoose
    let report = await this.reportModel.findOne({
      sampleId: { $regex: `^${sampleId}(?:\\s|\\(|$)`, $options: 'i' },
      isDeleted: false,
      status: { $ne: ReportStatus.COMPLETED },
    });

    // Fallback: If Sample ID fails, try to find the patient's most recent active report using MRN
    if (!report && patientId && patientId !== 'Unknown') {
      const patient = await this.patientModel.findOne({ mrn: patientId });
      if (patient) {
        report = await this.reportModel
          .findOne({
            patient: patient._id,
            isDeleted: false,
            status: { $ne: ReportStatus.COMPLETED },
          })
          .sort({ createdAt: -1 });
      }
    }

    if (!report) {
      throw new NotFoundException(
        `Active Report for sampleId ${sampleId} or patientId ${patientId} not found`,
      );
    }

    // Only load tests that are actually in this report
    const testIdsInReport = report.test.map((t) => t.name);
    const tests = await this.testModel.find({ _id: { $in: testIdsInReport } });

    let updatedCount = 0;
    tests.forEach((testDoc) => {
      // Find the value in results by matching keys safely
      let matchedKey: string | null = null;
      for (const key of Object.keys(results)) {
        const k = key.toLowerCase();
        const cleanK = k.replace(/[^a-z0-9]/g, ''); // "lym%", "*mentzr" -> "lym", "mentzr"
        const baseK = k.replace(/[^a-z0-9\-\+]/g, ''); // "lym%" -> "lym"
        const tCode = (testDoc.code || '').toLowerCase();
        const tName = (testDoc.name || '').toLowerCase();

        // Strict check for exactly same strings or codes
        if (tCode === k || tName === k) {
          matchedKey = key;
          break;
        }

        // Specific handling for % vs # (Absolute vs Percentage)
        const isPercentTest =
          tName.includes('%') || tName.includes('percentage');
        const isAbsoluteTest =
          tName.includes('#') ||
          tName.includes('abs') ||
          tName.includes('absolute');

        const isMachinePercent = k.includes('%');
        const isMachineAbsolute = k.includes('#');

        // If one is explicitly percent and the other is absolute, DO NOT MATCH.
        if (
          (isPercentTest && isMachineAbsolute) ||
          (isAbsoluteTest && isMachinePercent)
        ) {
          continue;
        }

        if (
          tName.includes(`(${k})`) ||
          tName.includes(`(${k}+)`) ||
          tName.includes(`(${k}-)`) ||
          // Match stripped names cleanly only if isolated (boundaries)
          (cleanK.length >= 3 && new RegExp(`\\b${cleanK}\\b`).test(tName)) ||
          // Common Electrolyte Fallbacks
          (k === 'na' && tName.includes('sodium')) ||
          (k === 'k' && tName.includes('potassium')) ||
          (k === 'cl' && tName.includes('chloride')) ||
          // Common CBC Fallbacks (Erba H360)
          (k === 'wbc' &&
            (tName.includes('white blood') ||
              tName.includes('total count') ||
              new RegExp(`\\btc\\b`).test(tName))) ||
          (k === 'rbc' && tName.includes('red blood')) ||
          (k === 'hgb' &&
            (tName.includes('hemoglobin') ||
              tName.includes('(hb)') ||
              tName === 'hb' ||
              tName.includes('haemoglobin'))) ||
          (k === 'hct' &&
            (tName.includes('hematocrit') ||
              new RegExp(`\\bpcv\\b`).test(tName))) ||
          (baseK === 'lym' && tName.includes('lymphocyte')) ||
          (baseK === 'gran' &&
            (tName.includes('granulocyte') || tName.includes('neutrophil'))) ||
          (baseK === 'mid' &&
            (tName.includes('monocyte') || tName.includes('eosinophil'))) ||
          (k === 'plt' &&
            (new RegExp(`\\bplatelet\\b`).test(tName) ||
              new RegExp(`\\bplatelets\\b`).test(tName))) ||
          (k === 'pct' && tName.includes('plateletcrit')) ||
          (baseK === 'mentzr' && tName.includes('mentzer')) ||
          (baseK === 'rdwi' && tName.includes('rdwi'))
        ) {
          matchedKey = key;
          break;
        }
      }

      if (
        matchedKey &&
        results[matchedKey] &&
        results[matchedKey].value !== undefined
      ) {
        // Find this test in the report.test array
        const index = report.test.findIndex(
          (x) => x?.name?.toString() === testDoc._id.toString(),
        );
        if (index !== -1) {
          report.test[index].value = results[matchedKey].value;
          updatedCount++;
        }
      }
    });

    const allFilled = report.test.every((item) => {
      return (
        item.value !== null && item.value !== '' && item.value !== undefined
      );
    });

    // Update time test actually started/received
    if (!report.testStartedAt && updatedCount > 0) {
      report.testStartedAt = new Date();
    }

    report.status = allFilled
      ? ReportStatus.COMPLETED
      : ReportStatus.WAITING_FOR_RESULT;

    if (graphs && Object.keys(graphs).length > 0) {
      if (!report.graphs) report.graphs = {};
      Object.assign(report.graphs, graphs);
      report.markModified('graphs');
    }

    await report.save();

    return {
      message: `LIS Result processed from ${machine}. Updated ${updatedCount} parameters.`,
      reportId: report._id,
    };
  }

  async getPatientReports(patient: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(patient))
      throw new BadRequestException('Please provide a valid patient id.');
    const report = await this.reportModel
      .find({ patient, isDeleted: false })
      .populate('doctor', 'name specialization')
      .populate('lab', 'name')
      .populate('test.name')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return report;
  }

  async getPatients(query: GetLabPatientsDto) {
    const {
      page = 1,
      limit = 10,
      alreadyTested = 'true',
      q,
      gender,
      doctor,
      lastVisit,
      from,
      to,
      age,
    } = query;
    const skip = (page - 1) * limit;

    const patientFilter: any = { status: { $ne: PatientStatus.DELETED } };

    if (q) {
      const searchRegex = { $regex: q, $options: 'i' };
      const orConditions: any[] = [
        { name: searchRegex },
        { phoneNumber: searchRegex },
        { address: searchRegex },
        { mrn: searchRegex },
      ];
      if (mongoose.isValidObjectId(q)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(q) });
      }
      patientFilter.$or = orConditions;
    }

    if (gender) {
      patientFilter.gender = gender;
    }

    if (doctor && alreadyTested === 'false') {
      patientFilter.doctor = new mongoose.Types.ObjectId(doctor);
    }

    if (age) {
      const [minAge, maxAge] = age.split('-').map(Number);
      if (!isNaN(minAge) && !isNaN(maxAge)) {
        const now = new Date();
        const minDate = new Date(
          now.getFullYear() - maxAge - 1,
          now.getMonth(),
          now.getDate(),
        );
        const maxDate = new Date(
          now.getFullYear() - minAge,
          now.getMonth(),
          now.getDate(),
        );
        patientFilter.dateOfBirth = { $gte: minDate, $lte: maxDate };
      }
    }

    let patientIds: mongoose.Types.ObjectId[] | null = null;
    let total = 0;

    const reportMatch: any = {
      patient: { $exists: true, $ne: null },
      isDeleted: false,
    };

    if (lastVisit) {
      let dateLimit: Date | null = null;
      const now = new Date();
      if (lastVisit === '7') {
        dateLimit = new Date(now.setDate(now.getDate() - 7));
      } else if (lastVisit === '30') {
        dateLimit = new Date(now.setDate(now.getDate() - 30));
      } else if (lastVisit === 'Custom' && from && to) {
        reportMatch.createdAt = {
          $gte: new Date(from),
          $lte: new Date(to),
        };
      }

      if (dateLimit) {
        reportMatch.createdAt = { $gte: dateLimit };
      }
    }

    if (alreadyTested === 'true') {
      const aggregationPipeline: any[] = [
        { $match: reportMatch },
        {
          $group: {
            _id: '$patient',
            lastTestDate: { $max: '$createdAt' },
          },
        },
        {
          $lookup: {
            from: 'patients',
            localField: '_id',
            foreignField: '_id',
            as: 'patientDetail',
          },
        },
        { $unwind: '$patientDetail' },
        { $match: { 'patientDetail.status': { $ne: PatientStatus.DELETED } } },
      ];

      if (doctor) {
        aggregationPipeline.push({
          $match: {
            'patientDetail.doctor': new mongoose.Types.ObjectId(doctor),
          },
        });
      }

      if (q) {
        const searchRegex = { $regex: q, $options: 'i' };
        aggregationPipeline.push({
          $match: {
            $or: [
              { 'patientDetail.name': searchRegex },
              { 'patientDetail.phoneNumber': searchRegex },
              { 'patientDetail.address': searchRegex },
              { 'patientDetail.mrn': searchRegex },
            ],
          },
        });
        if (mongoose.isValidObjectId(q)) {
          (
            aggregationPipeline[aggregationPipeline.length - 1].$match
              .$or as any[]
          ).push({
            'patientDetail._id': new mongoose.Types.ObjectId(q),
          });
        }
      }

      if (gender) {
        aggregationPipeline.push({
          $match: { 'patientDetail.gender': gender },
        });
      }

      if (age) {
        const [minAge, maxAge] = age.split('-').map(Number);
        if (!isNaN(minAge) && !isNaN(maxAge)) {
          const now = new Date();
          const minDate = new Date(
            now.getFullYear() - maxAge - 1,
            now.getMonth(),
            now.getDate(),
          );
          const maxDate = new Date(
            now.getFullYear() - minAge,
            now.getMonth(),
            now.getDate(),
          );
          aggregationPipeline.push({
            $match: {
              'patientDetail.dateOfBirth': { $gte: minDate, $lte: maxDate },
            },
          });
        }
      }

      const countResult = await this.reportModel.aggregate([
        ...aggregationPipeline,
        { $count: 'total' },
      ]);
      total = countResult[0]?.total ?? 0;

      const result = await this.reportModel.aggregate([
        ...aggregationPipeline,
        { $sort: { lastTestDate: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]);

      patientIds = result.map((item) => item._id);
    } else {
      total = await this.patientModel.countDocuments(patientFilter);
    }

    let patients: any[] = [];

    if (alreadyTested === 'true') {
      if (patientIds && patientIds.length > 0) {
        const patientsUnordered = await this.patientModel
          .find({ _id: { $in: patientIds } })
          .lean()
          .exec();

        const patientMap = new Map(
          patientsUnordered.map((p) => [p._id.toString(), p]),
        );
        patients = patientIds
          .map((id) => patientMap.get(id.toString()))
          .filter((p) => !!p) as any[];
      } else {
        return { data: [], total: 0 };
      }
    } else {
      patients = await this.patientModel
        .find(patientFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();
    }

    const reports: any[] = await this.reportModel
      .find({
        patient: { $in: patients.map((e) => e._id) },
        isDeleted: false,
      })
      .lean()
      .exec();

    const data = patients.map((e) => {
      const patientReports = reports.filter(
        (i) => i.patient.toString() === e._id.toString(),
      );
      patientReports.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      return {
        ...e,
        visits: patientReports.length,
        lastVisit: patientReports[0]?.createdAt ?? null,
      };
    });

    return { data, total };
  }

  async sampleCollected(id: mongoose.Types.ObjectId, dto: SampleCollectedDto) {
    if (dto.sampleId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const rawSampleId = dto.sampleId.split(' (')[0].trim();

      const duplicateReport = await this.reportModel.findOne({
        _id: { $ne: id },
        sampleId: { $regex: new RegExp(`^${rawSampleId}\\b`, 'i') },
        createdAt: { $gte: today },
      });

      if (duplicateReport) {
        throw new ConflictException(
          `Warning: Sample ID "${rawSampleId}" is already assigned to another test today.`,
        );
      }
    }

    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }

    data.status = ReportStatus.SAMPLE_COLLECTED;
    data.sampleCollectedAt = new Date();
    data.sampleId = dto.sampleId;
    data.sampleType = dto?.sampleType || '';

    await data.save();
    return data;
  }

  async startTest(id: mongoose.Types.ObjectId) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    data.status = ReportStatus.WAITING_FOR_RESULT;
    data.testStartedAt = new Date();
    await data.save();
    return data;
  }

  async deleteReport(id: mongoose.Types.ObjectId) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    data.isDeleted = true;
    await data.save();
    return data;
  }

  async markAsFlagged(id: mongoose.Types.ObjectId) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    data.isFlagged = true;
    await data.save();
    return data;
  }

  async markAsUnflagged(id: mongoose.Types.ObjectId) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    data.isFlagged = false;
    await data.save();
    return data;
  }

  async getStatistics() {
    const data: any[] = await this.reportModel.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          upcoming: {
            $sum: {
              $cond: {
                if: { $eq: ['$status', ReportStatus.UPCOMING] },
                then: 1,
                else: 0,
              },
            },
          },
          sampleCollected: {
            $sum: {
              $cond: {
                if: { $eq: ['$status', ReportStatus.SAMPLE_COLLECTED] },
                then: 1,
                else: 0,
              },
            },
          },
          waitingForResult: {
            $sum: {
              $cond: {
                if: { $eq: ['$status', ReportStatus.WAITING_FOR_RESULT] },
                then: 1,
                else: 0,
              },
            },
          },
          completed: {
            $sum: {
              $cond: {
                if: { $eq: ['$status', ReportStatus.COMPLETED] },
                then: 1,
                else: 0,
              },
            },
          },
          flagged: {
            $sum: {
              $cond: {
                if: { $eq: ['$isFlagged', true] },
                then: 1,
                else: 0,
              },
            },
          },
        },
      },
    ]);
    return data[0];
  }

  async resetTimer(id: mongoose.Types.ObjectId, dto: { duration: number }) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    data.extraTime = data.extraTime + dto.duration;
    await data.save();
    return data;
  }

  async recoverReport(id: mongoose.Types.ObjectId) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    data.isDeleted = false;
    await data.save();
    return data;
  }

  async updateReport(id: mongoose.Types.ObjectId, dto: CreateReportDto) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }

    if (dto.test) {
      data.test = dto.test.map((t) => ({
        name: t.name,
        value: t.value ?? '',
      })) as any;
    }
    if (dto.panels) {
      data.panels = dto.panels;
    }
    if (dto.priority) {
      data.priority = dto.priority;
    }
    if (dto.date) {
      data.date = dto.date;
    }

    await data.save();
    return data;
  }

  async repeatReport(id: mongoose.Types.ObjectId) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    const newReport = await this.createReport({
      date: new Date(),
      doctor: data.doctor || null,
      panels: data.panels,
      test: data.test,
      patient: data.patient,
      priority: data.priority,
      sampleType: data.sampleType || '',
      status: ReportStatus.UPCOMING,
      lab: data.lab,
    });
    return newReport;
  }
}
