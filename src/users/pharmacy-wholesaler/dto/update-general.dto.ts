import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UpdateGeneralDto {
    @IsString({ message: 'Name must be a string' })
    @IsNotEmpty({ message: 'Name is required' })
    name: string;

    @IsString({ message: 'Contact person must be a string' })
    @IsNotEmpty({ message: 'Contact person is required' })
    contactPerson: string;

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
}
