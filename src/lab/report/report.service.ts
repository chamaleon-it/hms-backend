import {
  BadRequestException,
  Body,
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
import { LisResultDto } from './dto/lis-result.dto';
import { Test } from '../panels/schemas/test.schema';
import { Patient } from '../../patients/schemas/patient.schema';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel(Test.name) private testModel: Model<Test>,
    @InjectModel(Patient.name) private patientModel: Model<Patient>
  ) { }
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
      } else if (dto.status === "Deleted") {
        match.isDeleted = true;
      }
      else {
        match.status = dto.status;
      }
    }

    if (dto.startDate && dto.endDate) {
      match.createdAt = {
        $gte: dto.startDate,
        $lte: dto.endDate,
      }
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
            select: 'name'
          }
        },
      })
      // .sort({ createdAt: -1 })
      .lean()
      .exec();

    return data;
  }

  async updateResult(dto: ResultDto) {
    const { _id, test } = dto;

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

    return { message: 'Updated successfully' };
  }

  async updateFromLis(dto: LisResultDto) {
    const { sampleId, patientId, machine, results } = dto;

    // Use a regex to allow matching "004" to "004 (Blood)" safely in Mongoose
    let report = await this.reportModel.findOne({ 
      sampleId: { $regex: `^${sampleId}(?:\\s|\\(|$)`, $options: 'i' }, 
      isDeleted: false, 
      status: { $ne: ReportStatus.COMPLETED } 
    });
    
    // Fallback: If Sample ID fails, try to find the patient's most recent active report using MRN
    if (!report && patientId && patientId !== "Unknown") {
      const patient = await this.patientModel.findOne({ mrn: patientId });
      if (patient) {
        report = await this.reportModel.findOne({ 
          patient: patient._id, 
          isDeleted: false, 
          status: { $ne: ReportStatus.COMPLETED } 
        }).sort({ createdAt: -1 });
      }
    }

    if (!report) {
      throw new NotFoundException(`Active Report for sampleId ${sampleId} or patientId ${patientId} not found`);
    }

    // Only load tests that are actually in this report
    const testIdsInReport = report.test.map((t) => t.name);
    const tests = await this.testModel.find({ _id: { $in: testIdsInReport } });

    let updatedCount = 0;
    tests.forEach(testDoc => {
      // Find the value in results by matching keys safely
      let matchedKey: string | null = null;
      for (const key of Object.keys(results)) {
         const k = key.toLowerCase();
         const cleanK = k.replace(/[^a-z0-9]/g, ''); // "lym%", "*mentzr" -> "lym", "mentzr"
         const baseK = k.replace(/[^a-z0-9\-\+]/g, ''); // "lym%" -> "lym"
         const tCode = (testDoc.code || "").toLowerCase();
         const tName = (testDoc.name || "").toLowerCase();

         // Strict check for exactly same strings or codes
         if (tCode === k || tName === k) {
            matchedKey = key;
            break;
         }

         // Specific handling for % vs # (Absolute vs Percentage)
         const isPercentTest = tName.includes('%') || tName.includes('percentage');
         const isAbsoluteTest = tName.includes('#') || tName.includes('abs') || tName.includes('absolute');
         
         const isMachinePercent = k.includes('%');
         const isMachineAbsolute = k.includes('#');
         
         // If one is explicitly percent and the other is absolute, DO NOT MATCH.
         if ((isPercentTest && isMachineAbsolute) || (isAbsoluteTest && isMachinePercent)) {
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
           (k === 'wbc' && (tName.includes('white blood') || tName.includes('total count') || new RegExp(`\\btc\\b`).test(tName))) ||
           (k === 'rbc' && tName.includes('red blood')) ||
           (k === 'hgb' && (tName.includes('hemoglobin') || tName.includes('(hb)') || tName === 'hb' || tName.includes('haemoglobin'))) ||
           (k === 'hct' && (tName.includes('hematocrit') || new RegExp(`\\bpcv\\b`).test(tName))) ||
           (baseK === 'lym' && tName.includes('lymphocyte')) ||
           (baseK === 'gran' && (tName.includes('granulocyte') || tName.includes('neutrophil'))) ||
           (baseK === 'mid' && (tName.includes('monocyte') || tName.includes('eosinophil'))) ||
           (k === 'plt' && (new RegExp(`\\bplatelet\\b`).test(tName) || new RegExp(`\\bplatelets\\b`).test(tName))) ||
           (k === 'pct' && tName.includes('plateletcrit')) ||
           (baseK === 'mentzr' && tName.includes('mentzer')) ||
           (baseK === 'rdwi' && tName.includes('rdwi'))
         ) {
            matchedKey = key;
            break;
         }
      }

      if (matchedKey && results[matchedKey] && results[matchedKey].value !== undefined) {
        // Find this test in the report.test array
        const index = report.test.findIndex(
          (x) => x?.name?.toString() === testDoc._id.toString()
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

    await report.save();

    return { message: `LIS Result processed from ${machine}. Updated ${updatedCount} parameters.`, reportId: report._id };
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

  async getPatients() {
    type PatientOut = {
      _id: mongoose.Types.ObjectId;
      name?: string;
      phoneNumber?: string;
      gender?: string;
      dateOfBirth?: Date;
      address?: string;
      mrn?: string;
      createdAt?: Date;
      visits: number;
      lastVisit?: Date;
    };

    const patients: PatientOut[] = await this.reportModel
      .aggregate([
        {
          $match: {
            patient: { $exists: true, $ne: null },
            isDeleted: false,
          },
        },

        {
          $group: {
            _id: '$patient',
            visits: { $sum: 1 },
            lastVisit: { $max: '$createdAt' },
          },
        },

        {
          $lookup: {
            from: 'patients',
            localField: '_id',
            foreignField: '_id',
            as: 'patient',
          },
        },

        { $unwind: { path: '$patient', preserveNullAndEmptyArrays: false } },

        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                '$patient',
                { visits: '$visits', lastVisit: '$lastVisit' },
              ],
            },
          },
        },

        {
          $project: {
            name: 1,
            address: 1,
            mrn: 1,
            dateOfBirth: 1,
            gender: 1,
            phoneNumber: 1,
            createdAt: 1,
            visits: 1,
            lastVisit: 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ])
      .exec();

    return patients;
  }

  async sampleCollected(id: mongoose.Types.ObjectId, dto: SampleCollectedDto) {
    const data = await this.reportModel.findById(id);
    if (!data) {
      throw new NotFoundException('Records not found');
    }
    data.status = ReportStatus.SAMPLE_COLLECTED;
    data.sampleCollectedAt = new Date();
    data.sampleId = dto.sampleId;
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
    const data = await this.reportModel.aggregate([
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
      data.test = dto.test.map((t) => ({ name: t.name, value: t.value ?? '' })) as any;
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
    const newReport = await this.createReport({ date: new Date(), doctor: data.doctor, panels: data.panels, test: data.test, patient: data.patient, priority: data.priority, sampleType: data.sampleType, status: ReportStatus.UPCOMING, lab: data.lab })
    return newReport;
  }
}
