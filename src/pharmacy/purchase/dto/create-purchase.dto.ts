
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';

export class CreatePurchaseItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber({}, { message: 'unitPrice must be a number' })
  @Min(0)
  unitPrice: number;

  @IsInt({ message: 'quantity must be an integer' })
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string | null;
}


export class CreatePurchaseDto {
  @IsMongoId()
  wholesaler: mongoose.Types.ObjectId;

  @IsOptional()
  pharmacy!: mongoose.Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  contactPerson: string;


  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  expectedDelivery: string;

  @IsString()
  @IsNotEmpty()
  paymentTerms: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items: CreatePurchaseItemDto[];

  @IsOptional()
  @IsNumber({}, { message: 'shipping must be a number or null' })
  shipping?: number | null;

  @IsOptional()
  @IsString()
  instructions?: string | null;

  @IsOptional()
  @IsBoolean()
  partialDelivery?: boolean;

  @IsOptional()
  @IsBoolean()
  urgent?: boolean;
}
