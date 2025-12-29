import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateBillingDto {
  @IsString({ message: 'Prefix must be a string' })
  @IsNotEmpty({ message: 'Prefix is required' })
  prefix: string;

  @IsNumber({}, { message: 'Default GST must be a number' })
  @IsNotEmpty({ message: 'Default GST is required' })
  defaultGst: number;

  @IsBoolean({ message: 'Round off must be a boolean' })
  @IsNotEmpty({ message: 'Round off is required' })
  roundOff: boolean;

  @IsBoolean({ message: 'Auto print after save must be a boolean' })
  @IsNotEmpty({ message: 'Auto print after save is required' })
  autoPrintAfterSave: boolean;

  @IsBoolean({ message: 'Auto generate bill must be a boolean' })
  @IsNotEmpty({ message: 'Auto generate bill is required' })
  autoGenerateBill: boolean;
}
