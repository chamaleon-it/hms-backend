import { Transform } from 'class-transformer';
import {
  IsString,
  IsEmail,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'MatchPassword', async: false })
export class MatchPasswordConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments) {
    const object = args.object as any;
    return object.password === confirmPassword;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Passwords do not match.';
  }
}

export class CreateUserDto {
  @IsString({ message: 'Name must be a string.' })
  @Transform(({ value }: { value: string }) => value.trim())
  name: string;

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
