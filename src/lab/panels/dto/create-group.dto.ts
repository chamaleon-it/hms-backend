import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tests?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  panels?: string[];

  @IsOptional()
  user?: any;
}
