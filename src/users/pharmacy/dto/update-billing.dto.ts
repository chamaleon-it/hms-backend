import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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
}
