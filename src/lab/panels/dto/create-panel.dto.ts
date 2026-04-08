import { Transform } from 'class-transformer';
import {
  IsEmpty,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  IsOptional,
  IsArray,
} from 'class-validator';
import mongoose from 'mongoose';

export class CreatePanelDto {
  @Transform(({ value }: { value: string }) => value.trim())
  @IsString({ message: 'Panel name must be a string' })
  @IsNotEmpty({ message: 'Panel name should not be empty' })
  name: string;

  @Transform(({ value }: { value: number }) => value)
  @IsNumber({}, { message: 'Panel price must be a number' })
  @IsNotEmpty({ message: 'Panel price should not be empty' })
  @Min(1, { message: 'Panel price should be greater than 0' })
  price: number;

  @IsOptional()
  @IsNumber({}, { message: 'Estimated time must be a number' })
  estimatedTime?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tests?: string[];

  @IsOptional()
  mainHeading?: string;

  @IsEmpty()
  user: mongoose.Types.ObjectId;
}
