import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { GetRefreshTokenDto } from './dto/get-refresh-token.dto';

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
}
