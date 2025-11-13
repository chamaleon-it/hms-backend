import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetBillingItemDto {
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  item: string;

}
