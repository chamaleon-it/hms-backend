import { Type } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class IssueConsumableDto {
  @IsMongoId({ message: 'Item id must be valid' })
  @IsNotEmpty()
  itemId: string;

  @Type(() => Number)
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  department?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
