import { IsString, MaxLength } from 'class-validator';

export class ConsultationValuesDto {
  @IsString()
  @MaxLength(100000)
  value: string;
}
