import {  Type } from "class-transformer";
import {  IsInt, IsMongoId, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class FindAllPurchaseDto{

    @IsOptional()
     @IsMongoId()
      wholesaler?: string;
    
      @IsOptional()
      @IsMongoId()
      pharmacy?: string;

      @IsOptional()
      @IsString()
      status?:string

      @IsOptional()
      @Type(() => Number)
      @IsNumber()
      @IsInt()
      @Min(1)
      page:number = 1

      @IsOptional()
      @Type(() => Number)
      @IsNumber()
      @IsInt()
      @Min(1)
      limit:number = 10
}