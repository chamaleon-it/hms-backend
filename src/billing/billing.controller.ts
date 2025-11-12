import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async generateBill(@Body() createBill: CreateBillingDto,@GetUser() user:JWTUserInterface) {
    createBill.user = user.id
    const data = await this.billingService.generateBill(createBill)

    return {
      message:"Bill is created successfully.",
      data
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getBills(@GetUser() user:JWTUserInterface){
   const data = await this.billingService.getBills(user.id)
   return {
    message:"All bills were retrived successfully.",
    data
   }
  }
}
