import mongoose from 'mongoose';

export class ResultDto {
  _id: mongoose.Types.ObjectId;
  test: {
    _id: mongoose.Types.ObjectId;
    value: string | number;
    name:{
      _id:mongoose.Types.ObjectId;
    }
  }[];
}
