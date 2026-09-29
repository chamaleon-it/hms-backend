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
import { Appointment } from '../appointments/schemas/appointment.schema';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
  ) { }

  private escapeRegex(term: string): string {
    return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private searchRegex(term: string) {
    return { $regex: this.escapeRegex(term), $options: 'i' as const };
  }

  private matchesPatientQuery(
    patient: {
      name?: string;
      mrn?: string;
      phoneNumber?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      district?: string;
      state?: string;
      pinCode?: string;
      country?: string;
      uhid?: string;
    },
    term: string,
  ): boolean {
    return [
      patient.name,
      patient.mrn,
      patient.phoneNumber,
      patient.addressLine1,
      patient.addressLine2,
      patient.city,
      patient.district,
      patient.state,
      patient.pinCode,
      patient.country,
      patient.uhid,
    ].some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(term),
    );
  }

  private async generateUniqueMRN(): Promise<string> {
    const lastRecord = await this.patientModel
      .findOne({ mrn: { $regex: /^\d{1,5}$/ } })
      .collation({ locale: 'en_US', numericOrdering: true })
      .sort({ mrn: -1 })
      .select('mrn')
      .lean()
      .exec();

    let nextNumber = 1;
    if (lastRecord && lastRecord.mrn) {
      nextNumber = parseInt(lastRecord.mrn, 10) + 1;
    }

    let mrn: string;
    let exists = true;
    do {
      mrn = nextNumber.toString().padStart(5, '0');
      const existing = await this.patientModel.exists({ mrn });
      exists = !!existing;
      if (exists) nextNumber++;
    } while (exists);

    return mrn;
  }

  async register(
    patientRegisterDto: PatientRegisterDto,
    createdBy: mongoose.Types.ObjectId,
  ) {
    const { age, month, ...rest } = patientRegisterDto as PatientRegisterDto & {
      age?: number;
      month?: number;
    };

    if (!rest.dateOfBirth && (age != null || month != null)) {
      const yrs = Number(age) || 0;
      const mths = Number(month) || 0;
      const today = new Date();
      const dob = new Date(
        today.getFullYear() - yrs,
        today.getMonth() - mths,
        today.getDate(),
      );
      rest.dateOfBirth = dob.toISOString();
    }

    if (!rest.mrn) {
      const mrn = await this.generateUniqueMRN();
      rest.mrn = mrn;
    } else {
      const mrn = await this.patientModel.exists({
        mrn: rest.mrn,
      });
      if (mrn) {
        throw new BadRequestException('MRN already exists');
      }
    }
    const patient = await this.patientModel.create({
      ...rest,
      createdBy,
    });
    return patient;
  }

  async getUniqueLocations(field: string, q: string) {
    if (!['city', 'district', 'state', 'pinCode', 'country'].includes(field)) {
      throw new BadRequestException('Invalid field');
    }

    const matchQuery: any = { [field]: { $nin: [null, ''] } };
    if (q && q.trim()) {
      matchQuery[field] = {
        ...this.searchRegex(q.trim()),
        $nin: [null, ''],
      };
    }

    const data = await this.patientModel.aggregate([
      { $match: matchQuery },
      { $group: { _id: `$${field}` } },
      { $limit: 20 },
      { $project: { _id: 0, value: '$_id' } },
      { $sort: { value: 1 } },
    ]);

    return data.map((d) => d.value).filter(Boolean);
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
      consultedOnly,
      address,
      city,
      district,
      state,
      pincode,
    } = getPatientsDto;

    const skip = (page - 1) * limit;

    const filter: any = {};

    if (gender) {
      filter.gender = gender;
    }

    const now = new Date();
    const minA = Number(minAge);
    const maxA = Number(maxAge);

    if (Number.isFinite(minA) && Number.isFinite(maxA)) {
      if (minA > 0 || maxA < 100) {
        const minDate = new Date(
          now.getFullYear() - maxA - 1,
          now.getMonth(),
          now.getDate() + 1,
        );
        const maxDate = new Date(
          now.getFullYear() - minA,
          now.getMonth(),
          now.getDate(),
        );

        filter.$expr = {
          $and: [
            {
              $gte: [
                {
                  $convert: {
                    input: '$dateOfBirth',
                    to: 'date',
                    onError: null,
                    onNull: null,
                  },
                },
                minDate,
              ],
            },
            {
              $lte: [
                {
                  $convert: {
                    input: '$dateOfBirth',
                    to: 'date',
                    onError: null,
                    onNull: null,
                  },
                },
                maxDate,
              ],
            },
          ],
        };
      }
    }

    if (doctor) {
      filter.doctor = new mongoose.Types.ObjectId(doctor);
    }

    if (conditions) {
      const parsedConditions: string[] =
        typeof conditions === 'string' ? JSON.parse(conditions) : conditions;

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

    if (address) {
      const addressPattern = () => this.searchRegex(address.trim());
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { addressLine1: addressPattern() },
          { addressLine2: addressPattern() },
          { city: addressPattern() },
          { district: addressPattern() },
          { state: addressPattern() },
          { pinCode: addressPattern() },
          { country: addressPattern() },
        ],
      });
    }

    if (city) {
      filter.city = this.searchRegex(city.trim());
    }

    if (district) {
      filter.district = this.searchRegex(district.trim());
    }

    if (state) {
      filter.state = this.searchRegex(state.trim());
    }

    if (pincode) {
      filter.pinCode = this.searchRegex(pincode.trim());
    }

    filter.status = status || { $ne: PatientStatus.DELETED };

    if (consultedOnly === 'true') {
      const appointmentMatch: any = { isDeleted: false };
      if (doctor) {
        appointmentMatch.doctor = new mongoose.Types.ObjectId(doctor);
      }
      const patientsWithAppts = await this.appointmentModel.distinct(
        'patient',
        appointmentMatch,
      );
      filter._id = { $in: patientsWithAppts };
    }

    const rawQuery = (getPatientsDto.query || getPatientsDto.q || '').trim();

    if (!rawQuery) {
      const [data, total] = await Promise.all([
        this.patientModel
          .find(filter)
          .skip(skip)
          .limit(limit)
          .populate('doctor')
          .sort({ createdAt: -1 }),
        this.patientModel.countDocuments(filter),
      ]);
      return { data, total };
    }

    const searchTerm = rawQuery.toLowerCase();
    const searchPattern = () => this.searchRegex(rawQuery);

    const patients = await this.patientModel
      .find({
        ...filter,
        $or: [
          { name: searchPattern() },
          { mrn: searchPattern() },
          { phoneNumber: searchPattern() },
          { addressLine1: searchPattern() },
          { addressLine2: searchPattern() },
          { city: searchPattern() },
          { district: searchPattern() },
          { state: searchPattern() },
          { pinCode: searchPattern() },
          { country: searchPattern() },
          { uhid: searchPattern() },
        ],
      })
      .populate('doctor')
      .lean();

    const matchedPatients = patients.filter((patient) =>
      this.matchesPatientQuery(patient, searchTerm),
    );

    const getPriority = (patient: any): number => {
      const name = (patient.name || '').toLowerCase().trim();
      const mrn = (patient.mrn || '').toLowerCase();
      const phone = (patient.phoneNumber || '').toLowerCase();
      const address = [
        patient.addressLine1,
        patient.addressLine2,
        patient.city,
        patient.district,
        patient.state,
        patient.pinCode,
        patient.country,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const words = name.split(/\s+/);

      if (name === searchTerm || mrn === searchTerm || phone === searchTerm) {
        return 1;
      }

      if (name.startsWith(searchTerm)) {
        return 2;
      }

      if (words.some((word) => word.startsWith(searchTerm))) {
        return 3;
      }

      if (name.includes(searchTerm)) {
        return 4;
      }

      if (mrn.includes(searchTerm)) {
        return 5;
      }

      if (phone.includes(searchTerm)) {
        return 6;
      }

      if (address.includes(searchTerm)) {
        return 7;
      }

      return 10;
    };

    const sortedPatients = matchedPatients
      .map((patient) => ({
        ...patient,
        _searchPriority: getPriority(patient),
      }))
      .sort((a, b) => {
        if (a._searchPriority !== b._searchPriority) {
          return a._searchPriority - b._searchPriority;
        }
        return (
          new Date((b as any).createdAt || 0).getTime() -
          new Date((a as any).createdAt || 0).getTime()
        );
      });

    return {
      data: sortedPatients.slice(skip, skip + Number(limit)),
      total: sortedPatients.length,
    };
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
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

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
              {
                $match: {
                  createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                },
              },
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
    const { age, month, ...rest } = patientRegisterDto as PatientRegisterDto & {
      age?: number;
      month?: number;
    };

    if (!rest.dateOfBirth && (age != null || month != null)) {
      const yrs = Number(age) || 0;
      const mths = Number(month) || 0;
      const today = new Date();
      const dob = new Date(
        today.getFullYear() - yrs,
        today.getMonth() - mths,
        today.getDate(),
      );
      rest.dateOfBirth = dob.toISOString();
    }

    const data = await this.patientModel.findByIdAndUpdate(
      patient,
      { $set: rest, $unset: { address: 1 } },
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
      .select(
        'name phoneNumber email gender dateOfBirth blood mrn addressLine1 addressLine2 city district state pinCode country',
      )
      .lean()
      .exec();
    return data;
  }

  async uploadPatientDocument(
    id: mongoose.Types.ObjectId,
    docData: { name: string; url: string; originalName?: string },
  ) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Invalid patient ID');
    }
    const patient = await this.patientModel.findById(id);
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (!patient.documents) {
      patient.documents = [];
    }

    const index = patient.documents.findIndex((d) => d.name === docData.name);
    const newDoc = {
      name: docData.name,
      url: docData.url,
      originalName: docData.originalName || '',
      updatedAt: new Date(),
    };

    if (index >= 0) {
      patient.documents[index] = newDoc;
    } else {
      patient.documents.push(newDoc);
    }

    await patient.save();
    return patient;
  }
}
