import { Transform } from 'class-transformer';

export class GetListDto {
  query?: string;
  @Transform(({ value }: { value: string }) => JSON.parse(value))
  status?: string;
}
