import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateInPatientDto } from './dto/create-in-patient.dto';
import { UpdateInPatientDto } from './dto/update-in-patient.dto';
import { InPatient, InPatientDocument, IPStatus } from './schemas/in-patient.schema';
import { Patient, PatientDocument } from '../patients/schemas/patient.schema';

@Injectable()
export class InPatientsService {
  constructor(
    @InjectModel(InPatient.name) private inPatientModel: Model<InPatientDocument>,
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
  ) {}

  async create(createInPatientDto: CreateInPatientDto, user: any) {
    // Check if the patient already has an active (non-Discharged) IP record
    const existingActive = await this.inPatientModel.findOne({
      patientId: new Types.ObjectId(createInPatientDto.patientId),
      status: { $ne: IPStatus.DISCHARGED },
    }).lean();

    if (existingActive) {
      throw new ConflictException(
        `Patient already admitted (IP: ${existingActive.admissionNumber}, Status: ${existingActive.status})`,
      );
    }

    // Generate sequential admission number: IP-0001, IP-0002, ...
    const last = await this.inPatientModel
      .findOne()
      .sort({ createdAt: -1 })
      .select('admissionNumber')
      .lean();

    let nextSeq = 1;
    if (last?.admissionNumber) {
      const parts = last.admissionNumber.split('-');
      const num = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(num)) nextSeq = num + 1;
    }

    const admissionNumber = 'IP-' + String(nextSeq).padStart(4, '0');

    const newIP = new this.inPatientModel({
      ...createInPatientDto,
      admissionNumber,
      createdBy: user?._id,
      patientId: new Types.ObjectId(createInPatientDto.patientId),
      doctorId: new Types.ObjectId(createInPatientDto.doctorId),
    });
    return newIP.save();
  }

  async addIpNote(id: string, noteData: any, user: any) {
    const ip = await this.inPatientModel.findById(id);
    if (!ip) throw new NotFoundException(`In-patient record #${id} not found`);
    ip.ipNotes.push({ ...noteData, recordedBy: user?._id });
    await ip.save();
    return { data: ip, message: 'Note added successfully' };
  }


  async findAll(query: any) {
    const filter: any = {};
    if (query.q) {
      const searchRegex = new RegExp(query.q, 'i');

      const matchingPatients = await this.patientModel
        .find({
          $or: [
            { name: searchRegex },
            { mrn: searchRegex },
            { phoneNumber: searchRegex },
          ],
        })
        .select('_id')
        .lean();

      const patientIds = matchingPatients.map((p) => p._id);

      filter.$or = [
        { status: searchRegex },
        { admissionNumber: searchRegex },
        { ward: searchRegex },
        { room: searchRegex },
        { bed: searchRegex },
        { patientId: { $in: patientIds } },
      ];
    }

    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const data = await this.inPatientModel
      .find(filter)
      .populate('patientId', 'name mrn gender dateOfBirth phoneNumber')
      .populate('doctorId', 'name specialization')
      .sort({ admissionDate: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.inPatientModel.countDocuments(filter);

    return {
      message: 'In-patients retrieved successfully',
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const ip = await this.inPatientModel
      .findById(id)
      .populate('patientId', 'name mrn gender dateOfBirth phoneNumber')
      .populate('doctorId', 'name specialization')
      .exec();
    if (!ip) {
      throw new NotFoundException(`In-patient record #${id} not found`);
    }
    return { data: ip, message: 'In-patient record retrieved' };
  }

  async update(id: string, updateInPatientDto: UpdateInPatientDto, user: any) {
    const updateData: any = { ...updateInPatientDto, updatedBy: user?._id };
    if (updateInPatientDto.patientId) {
      updateData.patientId = new Types.ObjectId(updateInPatientDto.patientId);
    }
    if (updateInPatientDto.doctorId) {
      updateData.doctorId = new Types.ObjectId(updateInPatientDto.doctorId);
    }

    const updated = await this.inPatientModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('patientId', 'name mrn')
      .exec();

    if (!updated) {
      throw new NotFoundException(`In-patient record #${id} not found`);
    }
    return { data: updated, message: 'In-patient record updated successfully' };
  }

  async remove(id: string) {
    const deleted = await this.inPatientModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException(`In-patient record #${id} not found`);
    }
    return { data: deleted, message: 'In-patient record deleted successfully' };
  }
}
