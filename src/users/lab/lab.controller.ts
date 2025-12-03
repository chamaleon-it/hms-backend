import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { LabService } from './lab.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { UpdateGeneralDto } from './dto/update-general.dto';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { UpdateNotificationsDto } from './dto/update-notifications.dto';
import { UpdateCatalogueDto } from './dto/update-catalogue.dto';
import { AddTestDto } from './dto/add-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';

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

  @Patch('tests')
  @UseGuards(JwtAuthGuard)
  async updateTest(@GetUser() user: JWTUserInterface, @Body() dto: AddTestDto) {
    const data = await this.labService.addTests(user.id, dto);
    return {
      data,
      message: 'Lab catalogue settings updated successfully',
    };
  }

  @Patch("edit_test")
  @UseGuards(JwtAuthGuard)
  async editTest(@GetUser() user: JWTUserInterface, @Body() dto: UpdateTestDto){
    const data = await this.labService.editTest(user.id,dto)
  }

  @Get('')
  // @UseGuards(JwtAuthGuard)
  async getLab() {
    const data = await this.labService.getLab();
    return {
      data,
      message: 'All labs were retrived successfully.',
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
