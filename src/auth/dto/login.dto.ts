import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email must be a valid email address.' })
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  email: string;

  @IsString({ message: 'Password must be a string.' })
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  @Transform(({ value }: { value: string }) => value.trim())
  password: string;
}
