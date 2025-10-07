import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/createUser.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //create
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    const data = await this.usersService.createUser(createUserDto);
    return {
      data,
      message: 'User account created successfully',
    };
  }

  //get all users

  //get single users

  //delete users

  //update users

  //update status

  //assign role
}
