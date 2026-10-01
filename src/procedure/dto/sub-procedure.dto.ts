import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class SubProcedureDto {
  @IsOptional()
  @IsString()
  _id?: string;

  @IsString({ message: 'Sub-procedure name must be a string' })
  @IsNotEmpty({ message: 'Sub-procedure name is required' })
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
