import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateNotificationsDto {
  @IsBoolean()
  @IsNotEmpty()
  whatsapp: boolean;

  @IsBoolean()
  @IsNotEmpty()
  email: boolean;

  @IsBoolean()
  @IsNotEmpty()
  sms: boolean;

  @IsBoolean()
  @IsNotEmpty()
  inApp: boolean;

  @IsString()
  @IsOptional()
  note?: string;
}
