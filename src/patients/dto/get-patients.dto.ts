import { Gender } from '../schemas/patient.schema';
export class GetPatientsDto {
  page: number = 1;
  limit: number = 100;

  query?: string;

  gender?: Gender;
  minAge?: string;
  maxAge?: string;
  lastVisit?: string;
  conditions?: string;

  doctor?: string;

  status?: string;

  from?: string;
  to?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
}
