import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class SubTherapyDto {
  @IsOptional()
  @IsString()
  _id?: string;

  @IsString({ message: 'Sub-therapy name must be a string' })
  @IsNotEmpty({ message: 'Sub-therapy name is required' })
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
