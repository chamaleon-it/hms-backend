import { Transform } from 'class-transformer';
import { Gender } from '../schemas/patient.schema';
import { IsNumber, IsOptional } from 'class-validator';

export class GetPatientsDto {
  page: number = 1;
  limit: number = 100;

  query?: string;

  gender?: Gender;
  minAge?: string;
  maxAge?: string;
  lastVisit?: string;
  conditions?: string;
}
