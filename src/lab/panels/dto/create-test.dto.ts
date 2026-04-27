import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEmpty,
  IsNotEmpty,
  IsEnum,
  ValidateNested,
  ArrayNotEmpty,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import mongoose from 'mongoose';

// Enums
export enum DataTypeEnum {
  NUMBER = 'number',
  TEXT = 'text',
  BOOLEAN = 'boolean',
  OPTIONS = 'options',
}

export enum GenderEnum {
  BOTH = 'Both',
  MALE = 'Male',
  FEMALE = 'Female',
}

export enum DateTypeEnum {
  YEAR = 'Year',
  MONTH = 'Month',
  DAY = 'Day',
}

// Range DTO
export class RangeItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsNumber()
  min?: number;

  @IsOptional()
  @IsNumber()
  max?: number;

  @IsOptional()
  @IsNumber()
  fromAge?: number;

  @IsOptional()
  @IsNumber()
  toAge?: number;

  @IsEnum(GenderEnum)
  gender: GenderEnum;

  @IsEnum(DateTypeEnum)
  dateType: DateTypeEnum;
}

// Main DTO
export class CreateTestDto {
  @IsOptional()
  @IsString({ message: 'Code must be a string' })
  code?: string;

  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsNumber({}, { message: 'Price must be a number' })
  price: number;

  @IsString()
  @IsOptional()
  method?: string;

  @IsString()
  @IsOptional()
  specimen?: string;

  @IsString({ message: 'Type must be a string' })
  type: string;

  @IsOptional()
  @IsNumber({}, { message: 'Estimated time must be a number' })
  estimatedTime?: number;

  @IsEnum(DataTypeEnum, { message: 'Invalid dataType' })
  dataType: DataTypeEnum;

  @IsOptional()
  @IsString({ message: 'Unit must be a string' })
  unit?: string;

  @IsOptional()
  @IsArray({ message: 'Panels must be an array' })
  @IsString({ each: true, message: 'Each panel must be a string' })
  panels?: string[];

  @IsEmpty({ message: 'User should not be provided' })
  user: mongoose.Types.ObjectId;

  @ValidateIf((o) => o.dataType === DataTypeEnum.OPTIONS)
  @IsArray({ message: 'Options must be an array' })
  @ArrayNotEmpty({ message: 'Options cannot be empty' })
  @IsString({ each: true, message: 'Each option must be a string' })
  options?: string[];

  @IsOptional()
  @IsArray({ message: 'Range must be an array' })
  @ValidateNested({ each: true })
  @Type(() => RangeItemDto)
  range?: RangeItemDto[];

  @IsOptional()
  @IsString({ message: 'Note must be a string' })
  note?: string;
}
