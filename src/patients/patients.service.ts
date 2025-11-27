import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Gender, Patient, PatientStatus } from './schemas/patient.schema';
import mongoose, { Model } from 'mongoose';
import { PatientRegisterDto } from './dto/patient-register.dto';
import { GetPatientsDto } from './dto/get-patients.dto';
import { DeleteBulkPatientDto } from './dto/delete-bulk-patient.dto';

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
      mrn = `P${randomNum}`;

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
      doctor,
      status,
      from,
      to,
    } = getPatientsDto;

    const skip = (page - 1) * limit;

    let filter: {
      gender?: string;
      $or?: Record<string, Record<string, string>>[];
      doctor?: mongoose.Types.ObjectId;
      createdAt?: Record<string, Date>;
      status?: string | Record<string, PatientStatus>;
      dateOfBirth?: Record<string, Date>;
      conditions?: Record<string, string[]>;
    } = {};

    if (query && query.trim() !== '') {
      const searchRegex = { $regex: '^' + query, $options: 'i' };
      filter = {
        $or: [
          { name: searchRegex },
          { phoneNumber: searchRegex },
          { mrn: searchRegex },
        ],
      };
    }

    if (gender) {
      filter.gender = gender;
    }

    const ageFilter: Record<string, Date> = {};
    const now = new Date();

    if (minAge && Number.isFinite(Number(minAge))) {
      const maxDOB = new Date(
        now.getFullYear() - Number(minAge),
        now.getMonth(),
        now.getDate(),
      );
      ageFilter.$lte = maxDOB;
    }

    if (maxAge && Number.isFinite(Number(maxAge))) {
      const minDOB = new Date(
        now.getFullYear() - Number(maxAge) - 1,
        now.getMonth(),
        now.getDate() + 1,
      );
      ageFilter.$gte = minDOB;
    }

    if (Object.keys(ageFilter).length) {
      filter.dateOfBirth = ageFilter;
    }

    if (doctor) {
      filter.doctor = new mongoose.Types.ObjectId(doctor);
    }

    if (conditions) {
      const parsed: string[] =
        typeof conditions === 'string'
          ? (JSON.parse(conditions) as string[])
          : (conditions as string[]);

      if (parsed.length > 0) {
        filter.conditions = { $in: parsed };
      }
    }

    if (from && to) {
      const startUTC = new Date(from);
      const endUTC = new Date(to);
      filter.createdAt = {
        $gte: startUTC,
        $lt: endUTC,
      };
    }

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: PatientStatus.DELETED };
    }
    const data = await this.patientModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .populate('doctor')
      .sort({ createdAt: -1 });
    return data;
  }

  async getSinglePatient(id: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Please provide a valid patient id');
    }
    const patient = await this.patientModel
      .findById(id)
      .populate('doctor', 'name specialization');
    return patient;
  }

  async statistics() {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const dayIndex = (now.getDay() + 6) % 7;
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - dayIndex);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const facets = await this.patientModel
      .aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            active: [
              { $match: { status: PatientStatus.ACTIVE } },
              { $count: 'count' },
            ],
            inactive: [
              { $match: { status: PatientStatus.INACTIVE } },
              { $count: 'count' },
            ],

            critical: [
              { $match: { status: PatientStatus.CRITICAL } },
              { $count: 'count' },
            ],

            discharged: [
              { $match: { status: PatientStatus.DISCHARGED } },
              { $count: 'count' },
            ],

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

    const r = (facets[0] ?? {}) as Record<string, Record<'count', number>[]>;
    const toNum = (arr: { count: number }[] | undefined) =>
      arr && arr[0] ? arr[0].count : 0;

    return {
      total: toNum(r.total),
      active: toNum(r.active),
      inactive: toNum(r.inactive),
      critical: toNum(r.critical),
      discharged: toNum(r.discharged),
      today: toNum(r.today),
      thisWeek: toNum(r.thisWeek),
      thisMonth: toNum(r.thisMonth),
      male: toNum(r.male),
      female: toNum(r.female),
    };
  }

  async deleteBulkPatient(deleteBulkPatientDto: DeleteBulkPatientDto) {
    const result = await this.patientModel.updateMany(
      {
        _id: { $in: deleteBulkPatientDto.ids },
        status: { $ne: PatientStatus.DELETED },
      },
      { status: PatientStatus.DELETED },
    );

    if (result.matchedCount === 0)
      throw new NotFoundException(
        'No patients found or all patients already deleted.',
      );
  }

  async deletePatient(id: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Invalid patient ID provided.');
    }

    const patient = await this.patientModel.findOneAndUpdate(
      { _id: id, status: { $ne: PatientStatus.DELETED } }, // Prevent re-deleting
      { status: PatientStatus.DELETED },
      { new: true },
    );

    if (!patient) {
      throw new NotFoundException('Patient not found or already deleted.');
    }

    return patient;
  }

  async updatePatient(
    patientRegisterDto: PatientRegisterDto,
    patient: mongoose.Types.ObjectId,
  ) {
    const data = await this.patientModel.findByIdAndUpdate(
      patient,
      patientRegisterDto,
      { new: true },
    );
    if (!data) {
      throw new BadRequestException('Patient not found.');
    }
    return data;
  }
}
