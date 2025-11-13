import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export class AddBillingItemDto {
  @IsString()
  @Transform(({ value }: { value: string }) => value.trim())
  item: string;
}
