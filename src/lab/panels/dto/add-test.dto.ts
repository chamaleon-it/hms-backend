import mongoose from 'mongoose';
import { IsString, IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class AddTestDto {
  @IsNotEmpty({ message: 'Panel name is required' })
  @IsString({ message: 'Panel name must be a string' })
  panelName: string;

  @IsNotEmpty({ message: 'Tests array is required' })
  @IsArray({ message: 'Tests must be an array' })
  @IsMongoId({ each: true, message: 'Each test must be a valid MongoDB ID' })
  tests: mongoose.Types.ObjectId[];
}
