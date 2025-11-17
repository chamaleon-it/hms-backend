import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdatedLogisticsDto {
  @IsString()
  @IsNotEmpty()
  sameDayDispatchCutOf: string;
  @IsString()
  @IsNotEmpty()
  defaultCourier: string;
  @IsNumber()
  @IsNotEmpty()
  returnWindow: number;
  @IsBoolean()
  @IsNotEmpty()
  allowPartialDispatch: boolean;
  @IsBoolean()
  @IsNotEmpty()
  autoMergeOrders: boolean;
}
