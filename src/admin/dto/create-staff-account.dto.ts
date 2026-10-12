import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../users/schemas/user.schema';

export class CreateStaffAccountDto {
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name: string;

  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsIn([UserRole.PHARMACY, UserRole.LAB])
  role: UserRole.PHARMACY | UserRole.LAB;
}
