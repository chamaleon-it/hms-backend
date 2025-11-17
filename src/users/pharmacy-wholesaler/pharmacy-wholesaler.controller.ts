import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { PharmacyWholesalerService } from './pharmacy-wholesaler.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { UpdateGeneralDto } from './dto/update-general.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { UpdatedLogisticsDto } from './dto/update-logistics.dto';
import { UpdateNotificationsDto } from './dto/update-notifications.dto';

@Controller('users/pharmacy-wholesaler')
export class PharmacyWholesalerController {
  constructor(
    private readonly pharmacyWholesalerService: PharmacyWholesalerService,
  ) {}

  @Patch('general')
  @UseGuards(JwtAuthGuard)
  async updateGeneral(
    @GetUser() user: JWTUserInterface,
    @Body() dto: UpdateGeneralDto,
  ) {
    const data = await this.pharmacyWholesalerService.updateGeneral(
      user.id,
      dto,
    );
    return {
      data,
      message: 'General settings updated successfully',
    };
  }

  @Patch('pricing')
  @UseGuards(JwtAuthGuard)
  async updatePricing(
    @GetUser() user: JWTUserInterface,
    @Body() dto: UpdatePricingDto,
  ) {
    const data = await this.pharmacyWholesalerService.updatePricing(
      user.id,
      dto,
    );
    return {
      data,
      message: 'Pricing settings updated successfully',
    };
  }

  @Patch('logistics')
  @UseGuards(JwtAuthGuard)
  async updateLogistics(
    @GetUser() user: JWTUserInterface,
    @Body() dto: UpdatedLogisticsDto,
  ) {
    const data = await this.pharmacyWholesalerService.updateLogistics(
      user.id,
      dto,
    );
    return {
      data,
      message: 'Logistics settings updated successfully',
    };
  }

  @Patch('notifications')
  @UseGuards(JwtAuthGuard)
  async updateNotifications(
    @GetUser() user: JWTUserInterface,
    @Body() dto: UpdateNotificationsDto,
  ) {
    const data = await this.pharmacyWholesalerService.updateNotifications(
      user.id,
      dto,
    );
    return {
      data,
      message: 'Notifications settings updated successfully',
    };
  }
}
