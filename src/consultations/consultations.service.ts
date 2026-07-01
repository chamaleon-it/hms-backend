import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Consultation, ConsultationDocument, ConsultationStatus } from './schemas/consultation.schema';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectModel(Consultation.name) private consultationModel: Model<ConsultationDocument>,
  ) {}

  async createConsultation(createConsultationDto: CreateConsultationDto): Promise<ConsultationDocument> {
    const existingConsultation = await this.consultationModel.findOne({
      appointmentId: createConsultationDto.appointmentId,
    });

    if (existingConsultation) {
      return existingConsultation;
    }

    const roomId = `consultation-${createConsultationDto.appointmentId}-${randomUUID()}`;
    const meetingUrl = `http://localhost:8000/${roomId}`;

    const newConsultation = new this.consultationModel({
      ...createConsultationDto,
      roomId,
      meetingUrl,
      status: ConsultationStatus.PENDING,
    });

    return newConsultation.save();
  }

  async getConsultationById(id: mongoose.Types.ObjectId): Promise<ConsultationDocument> {
    const consultation = await this.consultationModel.findById(id).populate('doctorId patientId appointmentId');
    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }
    return consultation;
  }
  
  async getConsultationByAppointment(appointmentId: mongoose.Types.ObjectId): Promise<ConsultationDocument> {
    const consultation = await this.consultationModel.findOne({ appointmentId }).populate('doctorId patientId appointmentId');
    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }
    return consultation;
  }

  async startConsultation(id: mongoose.Types.ObjectId): Promise<ConsultationDocument> {
    const consultation = await this.consultationModel.findById(id);
    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    if (consultation.status === ConsultationStatus.COMPLETED) {
      throw new ConflictException('Consultation is already completed');
    }

    consultation.status = ConsultationStatus.IN_PROGRESS;
    if (!consultation.startedAt) {
      consultation.startedAt = new Date();
    }

    return consultation.save();
  }

  async endConsultation(id: mongoose.Types.ObjectId): Promise<ConsultationDocument> {
    const consultation = await this.consultationModel.findById(id);
    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    consultation.status = ConsultationStatus.COMPLETED;
    consultation.endedAt = new Date();

    return consultation.save();
  }

  async saveRecordingUrl(id: mongoose.Types.ObjectId, recordingUrl: string): Promise<ConsultationDocument> {
    const consultation = await this.consultationModel.findById(id);
    if (!consultation) {
      throw new NotFoundException('Consultation not found');
    }

    consultation.recordingUrl = recordingUrl;
    return consultation.save();
  }
}
