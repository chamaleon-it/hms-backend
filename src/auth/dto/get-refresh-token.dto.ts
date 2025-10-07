import { IsString } from 'class-validator';

export class GetRefreshTokenDto {
  @IsString({ message: 'Refresh token is missing.' })
  refreshToken: string;
}
