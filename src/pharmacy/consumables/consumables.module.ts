import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConsumablesController } from './consumables.controller';
import { ConsumablesService } from './consumables.service';
import {
  ConsumableIssue,
  ConsumableIssueSchema,
} from './schemas/consumable-issue.schema';
import { Item, ItemSchema } from '../items/schemas/item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConsumableIssue.name, schema: ConsumableIssueSchema },
      { name: Item.name, schema: ItemSchema },
    ]),
  ],
  controllers: [ConsumablesController],
  providers: [ConsumablesService],
  exports: [ConsumablesService],
})
export class ConsumablesModule {}
