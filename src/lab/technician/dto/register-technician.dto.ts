import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterTechnicianDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  qualification: string;

  @IsOptional()
  @IsString()
  designation: string;

  @IsOptional()
  @IsString()
  licenseNumber: string;
}
