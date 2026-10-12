import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { GetRefreshTokenDto } from './dto/get-refresh-token.dto';
import { JwtAuthGuard } from './auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(@Body() loginDto: LoginDto) {
    const data = await this.authService.login(loginDto);
    return {
      data,
      message: 'User login successfully',
    };
  }

  @Post('/refresh_token')
  async getRefreshToken(@Body() getRefreshTokenDto: GetRefreshTokenDto) {
    const data = await this.authService.getRefreshToken(getRefreshTokenDto);
    return {
      message: 'Token is updated',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  async logout(@GetUser() user: JWTUserInterface) {
    await this.authService.logout(user.id);
    return { message: 'User logged out successfully.' };
  }
}
