import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import {
  AccountTransaction,
  AccountTransactionSchema,
} from './schemas/account-transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AccountTransaction.name, schema: AccountTransactionSchema },
    ]),
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule {}
