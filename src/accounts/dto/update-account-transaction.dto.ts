import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountTransactionDto } from './create-account-transaction.dto';

export class UpdateAccountTransactionDto extends PartialType(
  CreateAccountTransactionDto,
) {}
