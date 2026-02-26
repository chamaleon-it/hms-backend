import { IsNotEmpty, IsString } from "class-validator";

export class SampleCollectedDto {
    @IsString()
    @IsNotEmpty()
    sampleId: string;
}