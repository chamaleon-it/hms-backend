import { Transform } from "class-transformer";
import { IsEmpty, IsNotEmpty, IsString } from "class-validator";
import mongoose from "mongoose";

export class CreatePanelDto {
    @Transform(({ value }) => value.trim())
    @IsString({message: 'Panel name must be a string'})
    @IsNotEmpty({message: 'Panel name should not be empty'})
    name: string;

    @IsEmpty()
    user:mongoose.Types.ObjectId;
}