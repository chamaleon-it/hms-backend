import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubTherapyDto } from './sub-therapy.dto';

export class CreateTherapyDto {
  @IsString({ message: 'Therapy name must be a string' })
  @IsNotEmpty({ message: 'Therapy name is required' })
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  hasSubTherapies?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubTherapyDto)
  subTherapies?: SubTherapyDto[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
