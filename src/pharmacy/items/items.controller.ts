import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { AddItemDto } from './dto/add-items.dto';
import { GetItemsDto } from './dto/get-items.dto';
import mongoose from 'mongoose';
import type { Response } from 'express';

@Controller('pharmacy/items')
@UseGuards(JwtAuthGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) { }

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

  @Get()
  async getItems(@Query() query: GetItemsDto) {
    const data = await this.itemsService.getItems(query);
    return {
      data: data.items,
      total: data.total,
      page: Number(query.page),
      limit: Number(query.limit),
      lowStockCount: data.lowStockCount,
      slowMovingCount: data.slowMovingCount,
      message: 'All items were retrieved successfully',
    };
  }

  @Get('suppliers')
  async getSuppliers() {
    const data = await this.itemsService.getSuppliers();
    return {
      data,
      message: 'All suppliers were retrieved successfully',
    };
  }

  @Patch(':id')
  async updateItem(
    @Body() addItemDto: AddItemDto,
    @Param('id') id: mongoose.Types.ObjectId,
  ) {
    const data = await this.itemsService.updateItem(id, addItemDto);
    return {
      data,
      message: 'Item updated successfully.',
    };
  }

  @Delete(':id')
  async deleteItem(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.itemsService.deleteItem(id);
    return {
      data,
      message: 'Item deleted successfully',
    };
  }

  @Get('export-csv')
  async exportCsv(@Res() res: Response) {
    const { csv, filename } = await this.itemsService.exportCsv();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.status(200).send(csv);
  }

  @Post('add_batch/:id')
  async addBatchItems(
    @Param('id') id: mongoose.Types.ObjectId,
    @Body()
    batchData: {
      batchNumber: string;
      quantity: number;
      expiryDate: Date;
      purchasePrice: number;
      supplier: string;
    },
  ) {
    const data = await this.itemsService.addBatchItems(id, batchData);
    return {
      data,
      message: 'Batch items added successfully',
    };
  }

}
