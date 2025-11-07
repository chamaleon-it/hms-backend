import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { FindAllPurchaseDto } from './dto/find-all-purchase.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';

@Controller('pharmacy/purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createPurchase(
    @Body() createPurchaseDto: CreatePurchaseDto,
    @GetUser() user: JWTUserInterface,
  ) {
    createPurchaseDto.pharmacy = user.id;
    const data = await this.purchaseService.createPurchase(createPurchaseDto);
    return {
      data,
      message: 'Purchase order created successfully.',
    };
  }

  @Get()
  async findAll(@Query() findAllPurchaseDto: FindAllPurchaseDto) {
    const data = await this.purchaseService.findAll(findAllPurchaseDto);
    return {
      message: 'All purchase details fetched successfully',
      ...data,
    };
  }
}
