import mongoose from 'mongoose';
import { IsArray, IsMongoId } from 'class-validator';

export class DeleteBulkPatientDto {
  @IsArray({ message: 'Patient IDs must be provided as an array' })
  @IsMongoId({
    each: true,
    message: 'Each patient ID must be a valid MongoDB ObjectId',
  })
  ids: mongoose.Types.ObjectId[];
}
