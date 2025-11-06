import { Module } from '@nestjs/common';
import { ReturnService } from './return.service';
import { ReturnController } from './return.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Return, ReturnSchema } from './schemas/return.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Return.name, schema: ReturnSchema }]),
  ],
  controllers: [ReturnController],
  providers: [ReturnService],
})
export class ReturnModule {}
