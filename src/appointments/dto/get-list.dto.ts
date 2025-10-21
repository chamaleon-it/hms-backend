import { Transform } from 'class-transformer';
import { AppointmentStatus } from '../schemas/appointment.schema';

export class GetListDto {
  query?: string;
  @Transform(({ value }: { value: string }) => JSON.parse(value))
  status?: string;

  date?: string;
}
