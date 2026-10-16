import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class MarkAsPaidDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;
}
