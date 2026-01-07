import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class GetCustomersDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @IsOptional()
    @Transform(({ value }) => (value === '' ? undefined : value))
    @IsEnum(['true', 'false'])
    alreadyPurchase?: 'true' | 'false' = 'true';
}
