import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class SettleBillDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  cash: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  online: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  discount: number;
}
