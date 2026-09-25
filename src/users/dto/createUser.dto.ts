import { Transform } from 'class-transformer';
import {
  IsString,
  IsEmail,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  IsIn,
} from 'class-validator';
import { UserRole } from '../schemas/user.schema';

/** Roles allowed on public self-registration (Admin/Super Admin must be provisioned separately). */
export const PUBLIC_REGISTER_ROLES = [
  UserRole.DOCTOR,
  UserRole.PHARMACY,
  UserRole.LAB,
] as const;

@ValidatorConstraint({ name: 'MatchPassword', async: false })
export class MatchPasswordConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments) {
    const object = args.object as { password: string };
    return object.password === confirmPassword;
  }

  defaultMessage() {
    return 'Passwords do not match.';
  }
}

export class CreateUserDto {
  @IsString({ message: 'Name must be a string.' })
  @Transform(({ value }: { value: string }) => value.trim())
  name: string;

  @IsIn(PUBLIC_REGISTER_ROLES, {
    message: 'Role must be Doctor, Pharmacy, or Lab.',
  })
  @Transform(({ value }: { value: string }) => value.trim())
  role: string;

  @IsEmail({}, { message: 'Email must be a valid email address.' })
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  email: string;

  @IsString({ message: 'Password must be a string.' })
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  @Transform(({ value }: { value: string }) => value.trim())
  password: string;

  @IsString({ message: 'Confirm password must be a string.' })
  @Validate(MatchPasswordConstraint, { message: 'Passwords do not match.' })
  @Transform(({ value }: { value: string }) => value.trim())
  confirmPassword: string;
}
