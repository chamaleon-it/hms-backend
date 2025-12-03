import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsNumber,
  IsPositive,
} from 'class-validator';

export class AddTestDto {
  @IsString({ message: 'Code must be a string.' })
  @IsNotEmpty({ message: 'Code is required.' })
  code: string;

  @IsString({ message: 'Name must be a string.' })
  @IsNotEmpty({ message: 'Name is required.' })
  name: string;

  @IsString({ message: 'Type must be a string.' })
  @IsIn(['Lab', 'Imaging'], {
    message: 'Type must be either "Lab" or "Imaging".',
  })
  type: 'Lab' | 'Imaging';

  @IsString({ message: 'Panel must be a string.' })
  panel: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Min must be a number.' })
  min?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Max must be a number.' })
  max?: number;

  @IsString({ message: 'Unit must be a string.' })
  @IsNotEmpty({ message: 'Unit is required.' })
  unit: string;

  @IsNumber()
  @IsPositive({ message: 'estimatedTime always positive.' })
  @Type(() => Number)
  @IsNotEmpty({ message: 'Estimated time is required.' })
  estimatedTime: number;
}
