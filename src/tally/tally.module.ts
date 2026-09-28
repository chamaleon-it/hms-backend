import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TallyController } from './tally.controller';
import { TallyService } from './tally.service';
import {
  TallyConnection,
  TallyConnectionSchema,
} from './schemas/tally-connection.schema';
import {
  AccountTransaction,
  AccountTransactionSchema,
} from 'src/accounts/schemas/account-transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TallyConnection.name, schema: TallyConnectionSchema },
      { name: AccountTransaction.name, schema: AccountTransactionSchema },
    ]),
  ],
  controllers: [TallyController],
  providers: [TallyService],
  exports: [TallyService],
})
export class TallyModule {}
