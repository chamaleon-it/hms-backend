import { IsMongoId } from "class-validator";
import mongoose from "mongoose";

export class MarkAllAsPackedDto {
    @IsMongoId()
    order:mongoose.Types.ObjectId

}