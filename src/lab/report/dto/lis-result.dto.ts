import { IsNotEmpty, IsObject, IsString, IsOptional } from 'class-validator';

export class LisResultDto {
  @IsString()
  @IsNotEmpty()
  sampleId: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsString()
  @IsNotEmpty()
  machine: string;

  @IsObject()
  @IsNotEmpty()
  results: Record<string, { value: any; unit?: string }>;

  @IsOptional()
  @IsObject()
  graphs?: Record<string, string>;
}
