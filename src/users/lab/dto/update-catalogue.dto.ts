import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateCatalogueDto {
  @IsBoolean({ message: 'Round off must be a boolean' })
  @IsNotEmpty({ message: 'Round off is required' })
  showProfilesOnPatientBill: boolean;

  @IsBoolean({ message: 'Auto print after save must be a boolean' })
  @IsNotEmpty({ message: 'Auto print after save is required' })
  allowEditingPanelComposition: boolean;
}
