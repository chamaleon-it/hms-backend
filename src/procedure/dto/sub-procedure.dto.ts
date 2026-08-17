import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SubProcedureDto {
  @IsOptional()
  @IsString()
  _id?: string;

  @IsString({ message: 'Sub-procedure name must be a string' })
  @IsNotEmpty({ message: 'Sub-procedure name is required' })
  name: string;

  @IsNumber({}, { message: 'Sub-procedure price must be a valid number' })
  @Min(0, { message: 'Sub-procedure price must be non-negative' })
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
