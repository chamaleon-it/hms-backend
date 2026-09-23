import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateGeneralDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString({ message: 'Owner must be a string' })
  @IsNotEmpty({ message: 'Owner is required' })
  owner: string;

  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  phoneNumber: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'GSTIN must be a string' })
  @IsNotEmpty({ message: 'GSTIN is required' })
  gstin: string;

  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address is required' })
  address: string;

  @IsOptional()
  @IsString({ message: 'Slogan must be a string' })
  slogan?: string;

  @IsOptional()
  @IsString({ message: 'Advertisement must be a string' })
  advertisement?: string;

  @IsOptional()
  @IsArray({ message: 'Services must be an array' })
  @IsString({ each: true, message: 'Each service must be a string' })
  services?: string[];
}
