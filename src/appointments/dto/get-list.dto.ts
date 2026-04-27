import { Transform } from 'class-transformer';

export class GetListDto {
  query?: string;

  @Transform(({ value }: { value: string }): string => JSON.parse(value))
  status?: string[];

  date?: string;

  activeDate: 'Today' | '7 days' | '30 days' | 'Custom';
}
