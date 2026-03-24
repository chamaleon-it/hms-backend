import { PartialType } from '@nestjs/mapped-types';
import { AddBillingItemDto } from './add-billing-item.dto';

export class UpdateBillingItemDto extends PartialType(AddBillingItemDto) {}
