import { IsMongoId, IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import mongoose from 'mongoose';
import { ConsultationStatus } from '../schemas/consultation.schema';

export class CreateConsultationDto {
  @IsNotEmpty()
  @IsMongoId()
  appointmentId: mongoose.Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  doctorId: mongoose.Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  patientId: mongoose.Types.ObjectId;
}
