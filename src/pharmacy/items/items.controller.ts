import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { AddItemDto } from './dto/add-items.dto';
import { GetItemsDto } from './dto/get-items.dto';
import mongoose from 'mongoose';

@Controller('pharmacy/items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async addItems(
    @GetUser() user: JWTUserInterface,
    @Body() addItemDto: AddItemDto,
  ) {
    const data = await this.itemsService.addItems(user.id, addItemDto);
    return {
      data,
      message: 'Items added successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getItems(@Query() query: GetItemsDto) {
    const data = await this.itemsService.getItems(query);
    return {
      data: data.items,
      total: data.total,
      page: Number(query.page),
      limit: Number(query.limit),
      message: 'All items were retrieved successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  async getItem() {}

  @UseGuards(JwtAuthGuard)
  async updateItem() {}

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteItem(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.itemsService.deleteItem(id);
    return {
      data,
      message: 'Item deleted successfully',
    };
  }
}
