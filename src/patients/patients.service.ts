import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Patient } from './schemas/patient.schema';
import mongoose, { Model } from 'mongoose';
import { PatientRegisterDto } from './dto/patient-register.dto';
import { GetPatientsDto } from './dto/get-patients.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
  ) {}

  async register(
    patientRegisterDto: PatientRegisterDto,
    createdBy: mongoose.Types.ObjectId,
  ) {
    const patient = await this.patientModel.create({
      ...patientRegisterDto,
      createdBy,
    });
    return patient;
  }

  async getPatient(getPatientsDto: GetPatientsDto) {
    const { limit = 10, page = 1, query = '' } = getPatientsDto;
    const skip = (page - 1) * limit;

    let filter = {};

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

    const data = await this.patientModel
      .find(filter)
      .skip(skip)
      .limit(limit)
      .populate('createdBy');
    return data;
  }
}
