import mongoose from "mongoose";

export class UpdateTestDto {
     code: string;
    name: string;
    type:  "Lab" | "Imaging";
    panel: string;
    min?: number;
    max?: number;
    unit: string;
    estimatedTime: number;
    _id: mongoose.Types.ObjectId;
}