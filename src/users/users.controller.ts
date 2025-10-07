import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/createUser.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //create
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    const data = await this.usersService.createUser(createUserDto);
    return {
      data,
      message:
        'Your account has been created successfully. Please wait while we review your profile — this process may take up to 24 hours.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@GetUser() user: JWTUserInterface) {
    const data = await this.usersService.getProfile(user);

    return {
      data,
      message: 'user profile retrived',
    };
  }

  //get all users

  //get single users

  //delete users

  //update users

  //update status

  //assign role
}
