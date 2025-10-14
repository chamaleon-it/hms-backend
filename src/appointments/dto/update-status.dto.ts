import { AppointmentStatus } from '../schemas/appointment.schema';
import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @IsEnum(AppointmentStatus, {
    message: 'Status must be a valid appointment status.',
  })
  status: AppointmentStatus;
}
