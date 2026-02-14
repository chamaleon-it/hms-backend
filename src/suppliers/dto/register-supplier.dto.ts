import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { SupplierStatus } from "../schemas/supplier.schema";




export class RegisterSupplierDto {

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsOptional()
    contactPerson: string;

    @IsString()
    @IsOptional()
    designation?: string;

    @IsString()
    @IsOptional()
    email: string;

    @IsObject()
    @IsOptional()
    address: {
        line1: string;
        line2?: string;
        city?: string;
        state?: string;
    };

    @IsString()
    @IsOptional()
    gstin?: string;

    @IsString()
    @IsOptional()
    msme?: string;

    @IsString()
    @IsOptional()
    pan?: string;

    @IsString()
    @IsOptional()
    dlNo?: string;

    @IsDateString()
    @IsOptional()
    dlExpiryDate?: string;

    @IsNumber()
    @IsOptional()
    balance?: number;

    @IsNumber()
    @IsOptional()
    paymentTerms?: number;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(SupplierStatus)
    @IsOptional()
    status?: SupplierStatus;
}