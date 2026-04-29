import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class GetBillDropdownDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    query: string;
}