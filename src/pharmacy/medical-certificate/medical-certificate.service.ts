import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { UsersService } from 'src/users/users.service';
import { CreateMedicalCertificateDto } from './dto/create-medical-certificate.dto';
import { GetMedicalCertificatesDto } from './dto/get-medical-certificates.dto';
import { MedicalCertificate } from './schemas/medical-certificate.schema';

const calendarDate = (value: string) => value.slice(0, 10);

const isRealCalendarDay = (day: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const [year, month, date] = day.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, date));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === date
  );
};

const atUtcNoon = (day: string) => new Date(`${day}T12:00:00.000Z`);

@Injectable()
export class MedicalCertificateService {
  constructor(
    @InjectModel(MedicalCertificate.name)
    private readonly certificateModel: Model<MedicalCertificate>,
    private readonly usersService: UsersService,
  ) {}

  async create(
    dto: CreateMedicalCertificateDto,
    createdBy?: mongoose.Types.ObjectId,
  ) {
    const dateFrom = calendarDate(dto.dateFrom);
    const dateTo = calendarDate(dto.dateTo);
    if (!isRealCalendarDay(dateFrom) || !isRealCalendarDay(dateTo)) {
      throw new BadRequestException('Enter a valid from date and to date.');
    }
    if (dateTo < dateFrom) {
      throw new BadRequestException('To date cannot be before the from date.');
    }

    if (!mongoose.isValidObjectId(dto.doctor)) {
      throw new BadRequestException('Select an existing doctor.');
    }

    const doctor = await this.usersService.findDoctorForCertificate(dto.doctor);

    if (!doctor) {
      throw new BadRequestException('Select an existing doctor.');
    }

    const doctorQualification = (
      dto.doctorQualification ||
      doctor.qualification ||
      doctor.specialization ||
      ''
    ).trim();
    const doctorRegistrationNumber = (
      dto.doctorRegistrationNumber ||
      doctor.licenseNo ||
      ''
    ).trim();

    if (!doctorQualification) {
      throw new BadRequestException(
        'This doctor has no qualification. Enter one before saving the certificate.',
      );
    }
    if (!doctorRegistrationNumber) {
      throw new BadRequestException(
        'This doctor has no registration number. Enter one before saving the certificate.',
      );
    }

    const created = await this.certificateModel.create({
      patientName: dto.patientName.trim(),
      age: dto.age.trim(),
      gender: dto.gender,
      reason: dto.reason.trim(),
      dateFrom: atUtcNoon(dateFrom),
      dateTo: atUtcNoon(dateTo),
      doctor: doctor._id,
      doctorName: doctor.name.trim(),
      doctorQualification,
      doctorRegistrationNumber,
      doctorSignature: doctor.signature || null,
      patient: dto.patient && mongoose.isValidObjectId(dto.patient) ? dto.patient : null,
      createdBy: createdBy ?? null,
    });

    return created.toObject();
  }

  async findAll(query: GetMedicalCertificatesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: Record<string, unknown> = {};
    const q = query.q?.trim();
    if (q) {
      const pattern = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ patientName: pattern }, { doctorName: pattern }, { reason: pattern }];
    }

    const [data, total] = await Promise.all([
      this.certificateModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.certificateModel.countDocuments(filter),
    ]);

    return { data, total, page, limit };
  }
}
