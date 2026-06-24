import {
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class UpdateReportLayoutDto {
  @IsBoolean()
  @IsOptional()
  panelPerPage?: boolean;
}
