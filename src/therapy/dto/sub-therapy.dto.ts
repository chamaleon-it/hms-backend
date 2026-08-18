import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SubTherapyDto {
  @IsOptional()
  @IsString()
  _id?: string;

  @IsString({ message: 'Sub-therapy name must be a string' })
  @IsNotEmpty({ message: 'Sub-therapy name is required' })
  name: string;

  @IsNumber({}, { message: 'Sub-therapy price must be a valid number' })
  @Min(0, { message: 'Sub-therapy price must be non-negative' })
  price: number;

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
