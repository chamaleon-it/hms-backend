import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { Public } from 'src/auth/decorators/public.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Public()
  @UseGuards(ThrottlerGuard)
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
      message: 'user profile retrieved',
    };
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('forgot_password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.usersService.forgotPassword(forgotPasswordDto);
    return {
      message:
        'If an account exists for that email, a password reset link will be sent.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('doctors')
  async getAllDoctors(@Query('includeDeleted') includeDeleted?: string) {
    const data = await this.usersService.getAllDoctors(
      includeDeleted === 'true',
    );
    return {
      data,
      message: 'All doctors data retrieved successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('role/:role')
  async getUsersByRole(@Param('role') role: string) {
    const data = await this.usersService.getUsersByRole(role);
    return {
      data,
      message: `All ${role} data retrieved successfully`,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('pharmacy_wholesaler')
  async getAllPharmacyWholesaler() {
    const data = await this.usersService.getAllPharmacyWholesaler();
    return {
      data,
      message: 'All pharmacy wholesaler data retrieved successfully',
    };
  }

  @Get('doctor_availability/:id')
  @UseGuards(JwtAuthGuard)
  async getDoctorAvailability(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.usersService.getDoctorAvailability(id);
    return {
      message: 'Doctor availability retrieved successfully',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('consultation_values')
  async syncConsultationValues(
    @GetUser() user: JWTUserInterface,
    @Body() body: { value: string },
  ) {
    const data = await this.usersService.syncConsultationValues(
      user.id,
      body.value,
    );
    return {
      message: 'Consultation values sync completed',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('consultation_values')
  async getConsultationValues(@GetUser() user: JWTUserInterface) {
    const data = await this.usersService.getConsultationValues(user.id);
    return {
      message: 'Consultation value retrieved successfully',
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

  // Reception manages doctors; Admin can soft-delete any user.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  @Delete(':id')
  async deleteUser(
    @GetUser() actor: JWTUserInterface,
    @Param('id') id: mongoose.Types.ObjectId,
  ) {
    if (actor.role === UserRole.RECEPTION) {
      const role = await this.usersService.findUserRoleById(id);
      if (role !== UserRole.DOCTOR) {
        throw new ForbiddenException(
          'Reception may only soft-delete doctor accounts.',
        );
      }
    }
    const data = await this.usersService.softDeleteUser(id);
    return {
      message: 'Doctor soft deleted successfully.',
      data,
    };
  }

  // Reception updates doctors; Admin can update any user by id.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  @Patch(':id')
  async updateUserById(
    @GetUser() actor: JWTUserInterface,
    @Param('id') id: mongoose.Types.ObjectId,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    if (actor.role === UserRole.RECEPTION) {
      const role = await this.usersService.findUserRoleById(id);
      if (role !== UserRole.DOCTOR) {
        throw new ForbiddenException(
          'Reception may only update doctor accounts.',
        );
      }
      if (
        (updateUserDto as any).role &&
        (updateUserDto as any).role !== UserRole.DOCTOR
      ) {
        throw new ForbiddenException('Reception cannot change user roles.');
      }
    }
    const data = await this.usersService.updateUser(id, updateUserDto);
    return {
      message: data
        ? 'User profile updated successfully.'
        : 'Failed to update user profile. Please try again later.',
      data,
    };
  }
}
