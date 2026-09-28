import { Type } from 'class-transformer';
import {
  Allow,
  IsArray,
  IsDateString,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';

export class ResultTestNameDto {
  @IsMongoId()
  _id: mongoose.Types.ObjectId;
}

export class ResultTestItemDto {
  @IsOptional()
  @IsMongoId()
  _id?: mongoose.Types.ObjectId;

  @ValidateNested()
  @Type(() => ResultTestNameDto)
  name: ResultTestNameDto;

  @IsOptional()
  value?: string | number;
}

export class ResultDto {
  @IsMongoId()
  _id: mongoose.Types.ObjectId;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResultTestItemDto)
  test: ResultTestItemDto[];

  @IsOptional()
  @IsDateString()
  collectedDate?: Date;

  @IsOptional()
  @IsDateString()
  reportedDate?: Date;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  status?: string;

  /** Aliases some FE clients send alongside collectedDate / reportedDate. */
  @IsOptional()
  @Allow()
  sampleCollectedAt?: Date | string;

  @IsOptional()
  @Allow()
  createdAt?: Date | string;

  @IsOptional()
  @Allow()
  testStartedAt?: Date | string;

  @IsOptional()
  @Allow()
  updatedAt?: Date | string;
}
