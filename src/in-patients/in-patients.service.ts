import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateInPatientDto } from './dto/create-in-patient.dto';
import { UpdateInPatientDto } from './dto/update-in-patient.dto';
import { InPatient, InPatientDocument } from './schemas/in-patient.schema';

@Injectable()
export class InPatientsService {
  constructor(
    @InjectModel(InPatient.name) private inPatientModel: Model<InPatientDocument>,
  ) {}

  async create(createInPatientDto: CreateInPatientDto, user: any) {
    const admissionNumber = 'IP-' + Math.floor(100000 + Math.random() * 900000);
    const newIP = new this.inPatientModel({
      ...createInPatientDto,
      admissionNumber,
      createdBy: user?._id,
      patientId: new Types.ObjectId(createInPatientDto.patientId),
      doctorId: new Types.ObjectId(createInPatientDto.doctorId),
    });
    return newIP.save();
  }

  async findAll(query: any) {
    const filter: any = {};
    if (query.q) {
      // Assuming you might want to filter by status or admission number
      filter.$or = [
        { status: new RegExp(query.q, 'i') },
        { admissionNumber: new RegExp(query.q, 'i') },
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
