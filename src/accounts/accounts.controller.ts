import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountTransactionDto } from './dto/create-account-transaction.dto';
import { UpdateAccountTransactionDto } from './dto/update-account-transaction.dto';
import { GetAccountTransactionsDto } from './dto/get-account-transactions.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { JWTUserInterface } from 'src/interface/jwt-user.interface';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  async create(
    @Body() dto: CreateAccountTransactionDto,
    @GetUser() user: JWTUserInterface,
  ) {
    const data = await this.accountsService.create(dto, user.id);
    return {
      message: 'Account transaction created successfully',
      data,
    };
  }

  @Get()
  async findAll(@Query() query: GetAccountTransactionsDto) {
    const res = await this.accountsService.findAll(query);
    return {
      message: 'Account transactions retrieved successfully',
      ...res,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.accountsService.findOne(id);
    return {
      message: 'Account transaction retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAccountTransactionDto,
    @GetUser() user: JWTUserInterface,
  ) {
    const data = await this.accountsService.update(id, dto, user.id);
    return {
      message: 'Account transaction updated successfully',
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser() user: JWTUserInterface) {
    const data = await this.accountsService.remove(id, user.id);
    return {
      message: 'Account transaction deleted successfully',
      data,
    };
  }
}
