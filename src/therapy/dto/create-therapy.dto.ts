import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
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
  @IsNumber({}, { message: 'Price must be a valid number' })
  @Min(0, { message: 'Price must be non-negative' })
  price?: number;

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
