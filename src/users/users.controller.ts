import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/createUser.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { UpdatePasswordDto } from './dto/updatePassword';
import mongoose from 'mongoose';

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

  @Post('forgot_password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const data = await this.usersService.forgotPassword(forgotPasswordDto);
    return {
      data,
      message:
        'The password reset link has been successfully sent to your email address.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('doctors')
  async getAllDoctors() {
    const data = await this.usersService.getAllDoctors();
    return {
      data,
      message: 'All doctors data retrived successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  async updateUser(
    @GetUser() user: JWTUserInterface,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const data = await this.usersService.updateUser(user.id, updateUserDto);
    return {
      message: data
        ? 'User profile updated successfully.'
        : 'Failed to update user profile. Please try again later.',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update_password')
  async updatePassword(
    @GetUser() user: JWTUserInterface,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    await this.usersService.updatePassword(user.id, updatePasswordDto);
    return {
      message: 'User password is updated.',
    };
  }

  @Get('doctor_availability/:id')
  async getDoctorAvailability(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.usersService.getDoctorAvailability(id);
    return {
      message: 'Doctor availability retrived successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('consultation_values')
  async syncConsultationValues(
    @GetUser() user: JWTUserInterface,
    @Body() { value }: { value: string },
  ) {
    const data = await this.usersService.syncConsultationValues(user.id, value);
    return {
      message:"Consultation values sync completed",
      data
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('consultation_values')
  async getConsultationValues(@GetUser() user: JWTUserInterface) {
    const data = await this.usersService.getConsultationValues(user.id)
    return {
      message:"Consultation value retrived successfully",
      data
    }
  }
}
