import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateReportLayoutDto {
  @IsEnum(['Classic', 'Modern'])
  @IsNotEmpty()
  reportLayout: 'Classic' | 'Modern';

  @IsBoolean()
  @IsOptional()
  panelPerPage: boolean;
}
