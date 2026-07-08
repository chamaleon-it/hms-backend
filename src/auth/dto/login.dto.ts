import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Email or Username must be a string.' })
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  emailOrUsername: string;

  @IsString({ message: 'Password must be a string.' })
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  @Transform(({ value }: { value: string }) => value.trim())
  password: string;
}
