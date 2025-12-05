import { IsDate, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateRemarksDto {


    @IsString()
    @IsOptional()
    remarks: string;

    @IsDate()
    @IsOptional()
    remarksDate: Date;
}