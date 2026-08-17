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
  @IsNumber({}, { message: 'Price must be a valid number' })
  @Min(0, { message: 'Price must be non-negative' })
  price?: number;

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
