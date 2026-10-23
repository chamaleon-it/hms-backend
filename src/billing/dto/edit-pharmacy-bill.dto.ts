import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateBillingItemDto } from './create-billing.dto';

export class EditPharmacyBillDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBillingItemDto)
  items: CreateBillingItemDto[];

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  discount: number;

  @IsString()
  @IsOptional()
  doctor?: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsDateString()
  expectedUpdatedAt: string;
}
