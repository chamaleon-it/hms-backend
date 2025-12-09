import { IsString, IsOptional, IsNumber, IsArray, IsEmpty } from 'class-validator';
import mongoose from 'mongoose';

export class CreateTestDto {
    @IsString({ message: 'Code must be a string' })
    code: string;

    @IsString({ message: 'Name must be a string' })
    name: string;

    @IsString({ message: 'Type must be a string' })
    type: string;

    @IsOptional()
    @IsNumber({}, { message: 'Estimated time must be a number' })
    estimatedTime?: number;

    @IsOptional()
    @IsNumber({}, { message: 'Minimum value must be a number' })
    min?: number;

    @IsOptional()
    @IsNumber({}, { message: 'Maximum value must be a number' })
    max?: number;
    
    @IsOptional()
    @IsString({ message: 'Unit must be a string' })
    unit?: string;

    @IsOptional()
    @IsArray({ message: 'Panels must be an array' })
    panels?: string[];

    @IsEmpty()
      user: mongoose.Types.ObjectId;
}