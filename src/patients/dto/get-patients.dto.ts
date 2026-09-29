import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Gender } from '../schemas/patient.schema';

// The global ValidationPipe runs with `whitelist: true`, which strips any
// property that carries no class-validator decorator. Every filter here must
// therefore be decorated or it silently never reaches the service.
const toOptionalNumber = ({ value }: { value: unknown }) =>
  value === '' || value == null ? undefined : Number(value);

export class GetPatientsDto {
  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  limit: number = 100;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  gender?: Gender;

  @IsOptional()
  @IsString()
  minAge?: string;

  @IsOptional()
  @IsString()
  maxAge?: string;

  @IsOptional()
  @IsString()
  lastVisit?: string;

  @IsOptional()
  conditions?: string | string[];

  @IsOptional()
  @IsString()
  doctor?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  consultedOnly?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  pincode?: string;
}
