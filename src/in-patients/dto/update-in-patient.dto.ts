import { PartialType } from '@nestjs/mapped-types';
import { CreateInPatientDto } from './create-in-patient.dto';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateInPatientDto extends PartialType(CreateInPatientDto) {
  @IsDateString()
  @IsOptional()
  dischargeDate?: Date;
}
