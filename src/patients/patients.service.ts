import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Gender, Patient } from './schemas/patient.schema';
import mongoose, { Model } from 'mongoose';
import { PatientRegisterDto } from './dto/patient-register.dto';
import { GetPatientsDto } from './dto/get-patients.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
  ) {}

  private async generateUniqueMRN(): Promise<string> {
    let mrn: string;
    let exists = true;

    do {
      const randomNum = Math.floor(1000000 + Math.random() * 9000000);
      mrn = `P-${randomNum}`;

      // Check if MRN already exists
      const existing = await this.patientModel.exists({ mrn });
      exists = !!existing;
    } while (exists);

    return mrn;
  }

  async register(
    patientRegisterDto: PatientRegisterDto,
    createdBy: mongoose.Types.ObjectId,
  ) {
    const mrn = await this.generateUniqueMRN();

    const patient = await this.patientModel.create({
      ...patientRegisterDto,
      createdBy,
      mrn,
    });
    return patient;
  }

  async getPatient(getPatientsDto: GetPatientsDto) {
    const {
      limit = 100,
      page = 1,
      query = '',
      gender,
      conditions,
      minAge = 0,
      maxAge = 100,
    } = getPatientsDto;

    const skip = (page - 1) * limit;

    let filter: any = {};

    if (query && query.trim() !== '') {
      const searchRegex = { $regex: query, $options: 'i' };
      filter = {
        $or: [
          { name: searchRegex },
          { phoneNumber: searchRegex },
          { email: searchRegex },
        ],
      };
    }

    if (gender) {
      filter.gender = gender;
    }

    const ageFilter: any = {};
    if (typeof Number(minAge) === 'number' && Number.isFinite(Number(minAge))) {
      ageFilter.$gte = Number(minAge);
    }
    if (typeof Number(maxAge) === 'number' && Number.isFinite(Number(maxAge))) {
      ageFilter.$lte = Number(maxAge);
    }
    if (Object.keys(ageFilter).length) {
      filter.age = ageFilter;
    }

    if (conditions) {
      if (JSON.parse(conditions).length > 0) {
        filter.condition = { $in: JSON.parse(conditions) };
      }
    }

    const data = await this.patientModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .populate('createdBy');
    return data;
  }

  async getSinglePatient(id: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Please provide a valid patient id');
    }
    const patient = await this.patientModel.findById(id);
    return patient;
  }

  async statistics() {
    const now = new Date();

    // start of today (local time)
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    // start of week (Monday). If you want Sunday, use: const dayIndex = now.getDay();
    const dayIndex = (now.getDay() + 6) % 7; // 0 = Monday, 6 = Sunday
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - dayIndex);

    // start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const facets = await this.patientModel
      .aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            today: [
              { $match: { createdAt: { $gte: startOfToday } } },
              { $count: 'count' },
            ],
            thisWeek: [
              { $match: { createdAt: { $gte: startOfWeek } } },
              { $count: 'count' },
            ],
            thisMonth: [
              { $match: { createdAt: { $gte: startOfMonth } } },
              { $count: 'count' },
            ],
            male: [{ $match: { gender: Gender.MALE } }, { $count: 'count' }],
            female: [
              { $match: { gender: Gender.FEMALE } },
              { $count: 'count' },
            ],
          },
        },
      ])
      .exec();

    const r = facets[0] || {};

    const toNum = (arr: { count: number }[] | undefined) =>
      arr && arr[0] ? arr[0].count : 0;

    return {
      total: toNum(r.total),
      today: toNum(r.today),
      thisWeek: toNum(r.thisWeek),
      thisMonth: toNum(r.thisMonth),
      male: toNum(r.male),
      female: toNum(r.female),
    };
  }
}
