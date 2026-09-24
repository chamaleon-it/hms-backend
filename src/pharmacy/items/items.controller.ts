import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/schemas/user.schema';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { AddItemDto } from './dto/add-items.dto';
import { GetItemsDto } from './dto/get-items.dto';
import {
  CreateBatchDto,
  PatchBatchStatusDto,
  UpdateBatchDto,
} from './dto/batch.dto';
import mongoose from 'mongoose';
import type { Response } from 'express';

@Controller('pharmacy/items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACY, UserRole.ADMIN, UserRole.SUPER_ADMIN)
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
      lowStockCount: data.lowStockCount,
      message: 'All items were retrieved successfully',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACY, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('suppliers')
  async getSuppliers() {
    const data = await this.itemsService.getSuppliers();
    return {
      data,
      message: 'All suppliers were retrieved successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getInventoryStats(
    @Query('lowStockThreshold') lowStockThreshold?: number,
  ) {
    const data = await this.itemsService.getInventoryStats(lowStockThreshold);
    return {
      data,
      message: 'Inventory stats retrieved successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/breakdown')
  async getInventoryValueBreakdown() {
    const data = await this.itemsService.getInventoryValueBreakdown();
    return {
      data,
      message: 'Inventory value breakdown retrieved successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/batches')
  async getItemBatches(
    @Param('id') id: mongoose.Types.ObjectId,
    @Query('sort') sort?: 'fefo' | 'fifo',
    @Query('includeExpired') includeExpired?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const data = await this.itemsService.getItemBatches(
      id,
      sort === 'fifo' ? 'fifo' : 'fefo',
      includeExpired === 'true',
      includeInactive === 'true',
    );
    return {
      data,
      message: 'Batches retrieved successfully',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACY, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post(':id/batches')
  async createBatch(
    @Param('id') id: mongoose.Types.ObjectId,
    @Body() dto: CreateBatchDto,
  ) {
    const data = await this.itemsService.createBatch(id, dto);
    return {
      data,
      message: 'Batch created successfully',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PHARMACY)
  @Put(':id/batches/:batchNumber')
  async updateBatch(
    @Param('id') id: mongoose.Types.ObjectId,
    @Param('batchNumber') batchNumber: string,
    @Body() dto: UpdateBatchDto,
    @GetUser() user: JWTUserInterface,
  ) {
    // Pharmacy may update rates/expiry/supplier/status but must not bypass
    // Admin-only stock quantity rules via batch PUT.
    if (
      user.role === UserRole.PHARMACY &&
      (dto.quantity != null || dto.startingQuantity != null)
    ) {
      throw new ForbiddenException(
        'Pharmacy cannot modify batch stock quantity. Use Purchase Entry to add stock, or ask an administrator.',
      );
    }

    const data = await this.itemsService.updateBatchByNumber(
      id,
      decodeURIComponent(batchNumber),
      dto,
    );
    return {
      data,
      message: 'Batch updated successfully',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PHARMACY)
  @Patch(':id/batches/:batchNumber/status')
  async patchBatchStatus(
    @Param('id') id: mongoose.Types.ObjectId,
    @Param('batchNumber') batchNumber: string,
    @Body() dto: PatchBatchStatusDto,
  ) {
    const data = await this.itemsService.patchBatchStatus(
      id,
      decodeURIComponent(batchNumber),
      dto,
    );
    return {
      data,
      message: `Batch ${dto.status === 'active' ? 'activated' : 'deactivated'} successfully`,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getItem(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.itemsService.getItem(id);
    return {
      data,
      message: 'Item retrieved successfully',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id/batches/:batchId')
  async deleteBatch(
    @Param('id') id: mongoose.Types.ObjectId,
    @Param('batchId') batchId: string,
    @Query('deductStock') deductStock?: string,
  ) {
    const shouldDeduct = deductStock === 'true';
    const data = await this.itemsService.deleteBatch(id, batchId, shouldDeduct);
    return {
      data,
      message: 'Batch deleted successfully',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete('delete_batch/:id/:batchId')
  async deleteBatchAlias(
    @Param('id') id: mongoose.Types.ObjectId,
    @Param('batchId') batchId: string,
    @Query('deductStock') deductStock?: string,
  ) {
    const shouldDeduct = deductStock === 'true';
    const data = await this.itemsService.deleteBatch(id, batchId, shouldDeduct);
    return {
      data,
      message: 'Batch deleted successfully',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id')
  async deleteItem(@Param('id') id: mongoose.Types.ObjectId) {
    const data = await this.itemsService.deleteItem(id);
    return {
      data,
      message: 'Item deleted successfully',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('export-csv')
  async exportCsv(@Res() res: Response) {
    const { csv, filename } = await this.itemsService.exportCsv();

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.status(200).send(csv);
  }

  /** Legacy alias — prefer POST :id/batches */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PHARMACY, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('add_batch/:id')
  async addBatchItems(
    @Param('id') id: mongoose.Types.ObjectId,
    @Body() batchData: CreateBatchDto,
  ) {
    const data = await this.itemsService.createBatch(id, batchData);
    return {
      data,
      message: 'Batch items added successfully',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('addmrp')
  async addMrp() {
    const data = await this.itemsService.addMRP();
    return {
      data,
      message: 'Mrp added successfully',
    };
  }
}
