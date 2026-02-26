import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEmpty,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import mongoose from 'mongoose';

export class CreateTestDto {
  @IsString({ message: 'Code must be a string' })
  code: string;

  @IsString({ message: 'Name must be a string' })
  name: string;

  @IsNumber({}, { message: 'Price must be a number' })
  price: number;

  @IsString({ message: 'Type must be a string' })
  type: string;

  @IsOptional()
  @IsNumber({}, { message: 'Estimated time must be a number' })
  estimatedTime?: number;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['number', 'text', 'boolean'])
  dataType: 'number' | 'text' | 'boolean';

  @IsOptional()
  @IsNumber({}, { message: 'Minimum value must be a number' })
  min?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Maximum value must be a number' })
  max?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Women minimum value must be a number' })
  womenMin?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Women maximum value must be a number' })
  womenMax?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Child minimum value must be a number' })
  childMin?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Child maximum value must be a number' })
  childMax?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Non-binary minimum value must be a number' })
  nbMin?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Non-binary maximum value must be a number' })
  nbMax?: number;

  @IsOptional()
  @IsString({ message: 'Unit must be a string' })
  unit?: string;

  @IsOptional()
  @IsArray({ message: 'Panels must be an array' })
  panels?: string[];

  @IsEmpty()
  user: mongoose.Types.ObjectId;
}
