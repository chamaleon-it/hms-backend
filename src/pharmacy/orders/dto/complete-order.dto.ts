import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { UpdateOrderItemDto } from './UpdateOrder.dto';

export class CompleteOrderDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderItemDto)
  items?: UpdateOrderItemDto[];

  @IsOptional()
  @IsNumber()
  discount?: number;
}
