import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Patient } from './schemas/patient.schema';
import mongoose, { Model } from 'mongoose';
import { PatientRegisterDto } from './dto/patient-register.dto';

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

  async getPatient() {
    const data = await this.patientModel.find().populate('createdBy');
    return data;
  }
}
