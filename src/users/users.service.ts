import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createUser(createUserDto: CreateUserDto) {
    const isUserExist = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (isUserExist) {
      throw new BadRequestException('User already exist.');
    }
    createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.userModel.create(createUserDto);
    return user;
  }
}
