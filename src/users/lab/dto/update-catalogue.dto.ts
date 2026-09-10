import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateCatalogueDto {
  @IsBoolean({ message: 'showProfilesOnPatientBill must be a boolean' })
  @IsNotEmpty({ message: 'showProfilesOnPatientBill is required' })
  showProfilesOnPatientBill: boolean;

  @IsBoolean({ message: 'Auto print after save must be a boolean' })
  @IsNotEmpty({ message: 'Auto print after save is required' })
  allowEditingPanelComposition: boolean;
}
