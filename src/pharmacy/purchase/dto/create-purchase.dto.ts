import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsMongoId,
  IsNotEmpty,
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
  @IsString()
  instructions?: string | null;

  @IsOptional()
  @IsBoolean()
  partialDelivery?: boolean;

  @IsOptional()
  @IsBoolean()
  urgent?: boolean;
}
