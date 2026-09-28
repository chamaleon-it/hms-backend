import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import mongoose, { Types } from 'mongoose';
import { ReportStatus } from 'src/lab/report/schemas/report.schema';

export class CreateReportTestDto {
  @IsMongoId()
  name: mongoose.Types.ObjectId;

  @IsOptional()
  value?: string | number;
}

export class CreateReportDto {
  @IsMongoId()
  patient: Types.ObjectId;

  @IsOptional()
  @IsMongoId()
  doctor?: Types.ObjectId | null;

  @IsOptional()
  @IsMongoId()
  lab?: Types.ObjectId;

  @IsDateString()
  date: Date;

  @IsString()
  @IsNotEmpty()
  priority: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  panels?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  groups?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReportTestDto)
  test: CreateReportTestDto[];

  @IsOptional()
  @IsString()
  sampleType?: string;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsString()
  technician?: string;
}
