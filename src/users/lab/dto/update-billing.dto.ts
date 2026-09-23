import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateBillingDto {
  @IsString({ message: 'Prefix must be a string' })
  @IsNotEmpty({ message: 'Prefix is required' })
  prefix: string;

  @IsBoolean({ message: 'Auto print after save must be a boolean' })
  @IsNotEmpty({ message: 'Auto print after save is required' })
  autoPrintAfterSave: boolean;

  @IsOptional()
  @IsBoolean({ message: 'Print dual copies must be a boolean' })
  printDualCopies?: boolean;
}
