import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBillingDto {
  @IsString({ message: 'Prefix must be a string' })
  @IsNotEmpty({ message: 'Prefix is required' })
  prefix: string;

  @IsBoolean({ message: 'Auto print after save must be a boolean' })
  @IsNotEmpty({ message: 'Auto print after save is required' })
  autoPrintAfterSave: boolean;

  @IsBoolean({ message: 'Auto generate bill must be a boolean' })
  @IsNotEmpty({ message: 'Auto generate bill is required' })
  autoGenerateBill: boolean;

  @IsBoolean({ message: 'Auto generate prescription must be a boolean' })
  @IsNotEmpty({ message: 'Auto generate prescription is required' })
  autoGeneratePrescription: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Print dual copies must be a boolean' })
  printDualCopies?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Free reconsult days must be a number' })
  @Min(0, { message: 'Free reconsult days cannot be negative' })
  freeReconsultDays?: number;
}
