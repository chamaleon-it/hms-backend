import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class GetBillingItemDto {
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  @IsOptional()
  item: string;
}
