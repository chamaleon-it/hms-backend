import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateNotificationsDto {
    @IsBoolean({ message: 'whatsapp must be a boolean value' })
    @IsNotEmpty({ message: 'whatsapp is required' })
    whatsapp: boolean;

    @IsBoolean({ message: 'sms must be a boolean value' })
    @IsNotEmpty({ message: 'sms is required' })
    sms: boolean;

    @IsBoolean({ message: 'soundNotificationInApp must be a boolean value' })
    @IsNotEmpty({ message: 'soundNotificationInApp is required' })
    inApp: boolean;

    @IsOptional()
    @IsString({ message: 'note must be a string' })
    note?: string;
}
