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
import { UpdateRemarksDto } from './dto/update-remarks.dto';
import { CheckPatientAlreadyExistsDto } from './dto/check-patient-already-exists.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
  ) { }

  private async generateUniqueMRN(): Promise<string> {
    let mrn: string;
    let exists = true;

    do {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      mrn = `${randomNum}`;

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
    if (!patientRegisterDto.mrn) {
      const mrn = await this.generateUniqueMRN();
      patientRegisterDto.mrn = mrn;
    } else {
      const mrn = await this.patientModel.exists({
        mrn: patientRegisterDto.mrn,
      });
      if (mrn) {
        throw new BadRequestException('MRN already exists');
      }
    }

    const patient = await this.patientModel.create({
      ...patientRegisterDto,
      createdBy,
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
      minAge,
      maxAge,
      doctor,
      status,
      from,
      to,
    } = getPatientsDto;

    const skip = (page - 1) * limit;

    const filter: any = {};

    if (gender) {
      filter.gender = gender;
    }

    const ageFilter: Record<string, Date> = {};
    const now = new Date();

    if (Number.isFinite(Number(minAge))) {
      ageFilter.$lte = new Date(
        now.getFullYear() - Number(minAge),
        now.getMonth(),
        now.getDate(),
      );
    }

    if (Number.isFinite(Number(maxAge))) {
      ageFilter.$gte = new Date(
        now.getFullYear() - Number(maxAge) - 1,
        now.getMonth(),
        now.getDate() + 1,
      );
    }

    if (Object.keys(ageFilter).length > 0) {
      filter.dateOfBirth = ageFilter;
    }

    if (doctor) {
      filter.doctor = new mongoose.Types.ObjectId(doctor);
    }

    if (conditions) {
      const parsedConditions: string[] =
        typeof conditions === 'string'
          ? JSON.parse(conditions)
          : conditions;

      if (parsedConditions.length > 0) {
        filter.conditions = { $in: parsedConditions };
      }
    }

    if (from && to) {
      filter.createdAt = {
        $gte: new Date(from),
        $lt: new Date(to),
      };
    }

    filter.status = status || { $ne: PatientStatus.DELETED };

    if (!query?.trim()) {
      return this.patientModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .populate('doctor')
        .sort({ createdAt: -1 });
    }

    const searchTerm = query.trim().toLowerCase();

    const patients = await this.patientModel
      .find({
        ...filter,
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { mrn: { $regex: searchTerm, $options: 'i' } },
          { phoneNumber: { $regex: searchTerm, $options: 'i' } },
          { address: { $regex: searchTerm, $options: 'i' } },
        ],
      })
      .populate('doctor')
      .lean();

    const getPriority = (patient: any): number => {
      const name = (patient.name || '').toLowerCase().trim();
      const mrn = (patient.mrn || '').toLowerCase();
      const phone = (patient.phoneNumber || '').toLowerCase();
      const address = (patient.address || '').toLowerCase();

      const words = name.split(/\s+/);

      if (name.startsWith(searchTerm)) {
        return 1;
      }

      if (words.some((word) => word.startsWith(searchTerm))) {
        return 2;
      }

      if (words.some((word) => word.endsWith(searchTerm))) {
        return 3;
      }

      if (mrn.includes(searchTerm)) {
        return 4;
      }

      if (phone.includes(searchTerm)) {
        return 5;
      }

      if (address.includes(searchTerm)) {
        return 6;
      }

      return 999;
    };

    const sortedPatients = patients
      .map((patient) => ({
        ...patient,
        _searchPriority: getPriority(patient),
      }))
      .filter((patient) => patient._searchPriority !== 999)
      .sort((a, b) => {
        if (a._searchPriority !== b._searchPriority) {
          return a._searchPriority - b._searchPriority;
        }

        return (a.name || '').localeCompare(b.name || '', undefined, {
          sensitivity: 'base',
        });
      })
      .map(({ _searchPriority, ...patient }) => patient);

    return sortedPatients.slice(skip, skip + Number(limit));
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

  async updatePatientRemarks(
    updateRemarksDto: UpdateRemarksDto,
    patient: mongoose.Types.ObjectId,
  ) {
    const data = await this.patientModel.findByIdAndUpdate(
      patient,
      updateRemarksDto,
      { new: true },
    );
    if (!data) {
      throw new BadRequestException('Patient not found.');
    }
    return data;
  }

  async checkPatientAlreadyExists(
    checkPatientAlreadyExistsDto: CheckPatientAlreadyExistsDto,
  ) {
    const orConditions: any[] = [];

    if (checkPatientAlreadyExistsDto?.name) {
      orConditions.push({
        name: {
          $regex: `^${checkPatientAlreadyExistsDto.name}$`,
          $options: 'i',
        },
      });
    }

    if (checkPatientAlreadyExistsDto?.phoneNumber) {
      let phone = checkPatientAlreadyExistsDto.phoneNumber;
      phone = phone.replace(/\s+/g, '');
      phone = phone.replace(/^(\+91|91)/, '');
      phone = phone.replace(/\D/g, '');
      if (phone.length === 10) {
        const regexPattern = phone.split('').join('\\s*');

        orConditions.push({
          phoneNumber: {
            $regex: regexPattern,
            $options: 'i',
          },
        });
      }
    }

    if (checkPatientAlreadyExistsDto?.email) {
      orConditions.push({
        email: checkPatientAlreadyExistsDto.email.toLowerCase(),
      });
    }

    if (!orConditions.length) return null;

    const data = await this.patientModel
      .findOne({
        $or: orConditions,
      })
      .select('name phoneNumber email gender dateOfBirth blood mrn address')
      .lean()
      .exec();
    return data;
  }
}
