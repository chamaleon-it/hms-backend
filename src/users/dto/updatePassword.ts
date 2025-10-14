import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdatePasswordDto {
  @IsString({ message: 'Current password is required' })
  currentPassword: string;

  @IsString({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72, { message: 'Password must be at most 72 characters' })
  @Matches(/[a-z]/, { message: 'Must contain at least one lowercase letter' })
  @Matches(/[A-Z]/, { message: 'Must contain at least one uppercase letter' })
  @Matches(/\d/, { message: 'Must contain at least one number' })
  @Matches(/[^\w\s]/, { message: 'Must contain at least one symbol' })
  password: string;

  @IsString({ message: 'Confirm password is required' })
  confirmPassword: string;
}
