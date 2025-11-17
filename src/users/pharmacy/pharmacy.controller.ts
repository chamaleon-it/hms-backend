import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { UpdateGeneralDto } from './dto/update-general.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { UpdateNotificationsDto } from './dto/update-notifications.dto';

@Controller('users/pharmacy')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  @Patch('general')
  @UseGuards(JwtAuthGuard)
  async updateGeneral(
    @GetUser() user: JWTUserInterface,
    @Body() updateGeneralDto: UpdateGeneralDto,
  ) {
    const data = await this.pharmacyService.updateGeneral(
      user.id,
      updateGeneralDto,
    );
    return {
      data,
      message: 'Pharmacy general settings updated successfully',
    };
  }

  @Patch('billing')
  @UseGuards(JwtAuthGuard)
  async updateBilling(
    @GetUser() user: JWTUserInterface,
    @Body() dto: UpdateBillingDto,
  ) {
    const data = await this.pharmacyService.updateBilling(user.id, dto);
    return {
      data,
      message: 'Pharmacy billing settings updated successfully',
    };
  }

  @Patch('inventory')
  @UseGuards(JwtAuthGuard)
  async updateInventory(
    @GetUser() user: JWTUserInterface,
    @Body() dto: UpdateInventoryDto,
  ) {
    const data = await this.pharmacyService.updateInventory(user.id, dto);
    return {
      data,
      message: 'Pharmacy inventory settings updated successfully',
    };
  }

  @Patch('notifications')
  @UseGuards(JwtAuthGuard)
  async updateNotifications(
    @GetUser() user: JWTUserInterface,
    @Body() dto: UpdateNotificationsDto,
  ) {
    const data = await this.pharmacyService.updateNotifications(user.id, dto);
    return {
      data,
      message: 'Pharmacy notifications settings updated successfully',
    };
  }
}
