import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SubProcedureDto } from './sub-procedure.dto';

export class CreateProcedureDto {
  @IsString({ message: 'Procedure name must be a string' })
  @IsNotEmpty({ message: 'Procedure name is required' })
  name: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  hasSubProcedures?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubProcedureDto)
  subProcedures?: SubProcedureDto[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
