import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SampleCollectedDto {
  @IsString()
  @IsNotEmpty()
  sampleId: string;

  @IsString()
  @IsOptional()
  sampleType?: string;
}
