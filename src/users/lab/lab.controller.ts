import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { LabService } from './lab.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { UpdateGeneralDto } from './dto/update-general.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { UpdateNotificationsDto } from './dto/update-notifications.dto';
import { UpdateCatalogueDto } from './dto/update-catalogue.dto';

@Controller('users/lab')
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Patch('general')
  @UseGuards(JwtAuthGuard)
  async updateGeneral(
    @GetUser() user: JWTUserInterface,
    @Body() updateGeneralDto: UpdateGeneralDto,
  ) {
    const data = await this.labService.updateGeneral(user.id, updateGeneralDto);
    return {
      data,
      message: 'Lab general settings updated successfully',
    };
  }

  @Patch('billing')
  @UseGuards(JwtAuthGuard)
  async updateBilling(
    @GetUser() user: JWTUserInterface,
    @Body() dto: UpdateBillingDto,
  ) {
    const data = await this.labService.updateBilling(user.id, dto);
    return {
      data,
      message: 'Lab billing settings updated successfully',
    };
  }

  @Patch('catalogue')
  @UseGuards(JwtAuthGuard)
  async updateCatalogue(
    @GetUser() user: JWTUserInterface,
    @Body() dto: UpdateCatalogueDto,
  ) {
    const data = await this.labService.updateCatalogue(user.id, dto);
    return {
      data,
      message: 'Lab catalogue settings updated successfully',
    };
  }

  @Patch('notifications')
  @UseGuards(JwtAuthGuard)
  async updateNotifications(
    @GetUser() user: JWTUserInterface,
    @Body() dto: UpdateNotificationsDto,
  ) {
    const data = await this.labService.updateNotifications(user.id, dto);
    return {
      data,
      message: 'Lab notifications settings updated successfully',
    };
  }
}
