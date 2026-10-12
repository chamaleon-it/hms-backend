import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserRole, UserStatus } from 'src/users/schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import configuration from 'src/config/configuration';
import { GetRefreshTokenDto } from './dto/get-refresh-token.dto';
import { sanitizeUser } from './sanitize-user';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: loginDto.email })
      .select('+password');
    if (!user) {
      throw new BadRequestException(
        'No user record found. Kindly register to proceed.',
      );
    }
    if ((user.status as UserStatus) !== UserStatus.ACTIVE) {
      throw new BadRequestException(
        'This profile is not active. Please contact the administrator for assistance.',
      );
    }
    if (
      ![UserRole.ADMIN, UserRole.PHARMACY, UserRole.LAB].includes(
        user.role as UserRole,
      )
    ) {
      throw new BadRequestException(
        'This account type cannot sign in. Contact an administrator for assistance.',
      );
    }
    const isPasswordMatched = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordMatched) {
      throw new BadRequestException('Incorrect password. Please try again.');
    }

    const accessToken = await this.jwtService.signAsync(
      { id: user._id, email: user.email, role: user.role },
      {
        secret: configuration().secret.accessToken,
        expiresIn: '15m',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { id: user._id },
      {
        secret: configuration().secret.refreshToken,
        expiresIn: '15d',
      },
    );

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async getRefreshToken(getRefreshTokenDto: GetRefreshTokenDto) {
    try {
      const decoded: { id: mongoose.Types.ObjectId } =
        await this.jwtService.verifyAsync(getRefreshTokenDto.refreshToken, {
          secret: configuration().secret.refreshToken,
        });
      if (!decoded)
        throw new UnauthorizedException('Refresh token is missing or expired.');
      const { id } = decoded;
      const user = await this.userModel.findById(id).select('+refreshToken');
      if (!user) {
        throw new UnauthorizedException('Refresh token is invalid.');
      }

      if (
        user.status !== UserStatus.ACTIVE ||
        !user.refreshToken ||
        user.refreshToken !== getRefreshTokenDto.refreshToken
      ) {
        throw new UnauthorizedException('Refresh token is invalid or revoked.');
      }

      // const isRefreshTokenMatching =
      //   user?.refreshToken === getRefreshTokenDto.refreshToken;

      // if (!isRefreshTokenMatching)
      //   throw new UnauthorizedException('Refresh token is not matching.');

      const accessToken = await this.jwtService.signAsync(
        { id: user._id, email: user.email, role: user.role },
        {
          secret: configuration().secret.accessToken,
          expiresIn: '15m',
        },
      );

      const refreshToken = await this.jwtService.signAsync(
        { id: user._id },
        {
          secret: configuration().secret.refreshToken,
          expiresIn: '15d',
        },
      );

      user.refreshToken = refreshToken;
      await user.save();

      return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw error;
    }
  }

  async logout(id: mongoose.Types.ObjectId) {
    await this.userModel
      .findByIdAndUpdate(id, { $unset: { refreshToken: 1 } })
      .exec();
  }
}
