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
import { AddBatchDto } from './dto/add-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
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
  async getItems(
    @GetUser() user: JWTUserInterface,
    @Query() query: GetItemsDto,
  ) {
    const data = await this.itemsService.getItems(query, user);
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
  async getSuppliers(@GetUser() user: JWTUserInterface) {
    const data = await this.itemsService.getSuppliers(user);
    return {
      data,
      message: 'All suppliers were retrieved successfully',
    };
  }

  @Patch(':id')
  async updateItem(
    @GetUser() user: JWTUserInterface,
    @Body() addItemDto: AddItemDto,
    @Param('id') id: mongoose.Types.ObjectId,
  ) {
    const data = await this.itemsService.updateItem(id, addItemDto, user);
    return {
      data,
      message: 'Item updated successfully.',
    };
  }

  @Delete(':id')
  async deleteItem(
    @GetUser() user: JWTUserInterface,
    @Param('id') id: mongoose.Types.ObjectId,
  ) {
    const data = await this.itemsService.deleteItem(id, user);
    return {
      data,
      message: 'Item deleted successfully',
    };
  }

  @Get('export-csv')
  async exportCsv(
    @GetUser() user: JWTUserInterface,
    @Res() res: Response,
  ) {
    const { csv, filename } = await this.itemsService.exportCsv(user);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.status(200).send(csv);
  }

  @Get(':id')
  async getItem(
    @GetUser() user: JWTUserInterface,
    @Param('id') id: mongoose.Types.ObjectId,
  ) {
    const data = await this.itemsService.getItem(id, user);
    return {
      data,
      message: 'Item retrieved successfully',
    };
  }

  @Post('add_batch/:id')
  async addBatchItems(
    @GetUser() user: JWTUserInterface,
    @Param('id') id: mongoose.Types.ObjectId,
    @Body() batchData: AddBatchDto,
  ) {
    const data = await this.itemsService.addBatchItems(id, batchData, user);
    return {
      data,
      message: 'Batch items added successfully',
    };
  }

  @Patch(':id/batch/:batchId')
  async updateBatch(
    @GetUser() user: JWTUserInterface,
    @Param('id') id: mongoose.Types.ObjectId,
    @Param('batchId') batchId: string,
    @Body() body: UpdateBatchDto,
  ) {
    const data = await this.itemsService.updateBatch(id, batchId, body, user);
    return {
      data,
      message: 'Batch updated successfully',
    };
  }

  @Patch(':id/batch/:batchId/toggle')
  async toggleBatchStatus(
    @GetUser() user: JWTUserInterface,
    @Param('id') id: mongoose.Types.ObjectId,
    @Param('batchId') batchId: string,
  ) {
    const data = await this.itemsService.toggleBatchStatus(id, batchId, user);
    return {
      data,
      message: 'Batch status toggled successfully',
    };
  }
}
