import { IsMongoId } from "class-validator";
import mongoose from "mongoose";

export class PackedDto {
    @IsMongoId()
    order:mongoose.Types.ObjectId

    @IsMongoId()
    item:mongoose.Types.ObjectId

}