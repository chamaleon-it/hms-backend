import { Module } from '@nestjs/common';
import { PanelsService } from './panels.service';
import { PanelsController } from './panels.controller';
import { Panel, PanelSchema } from './schemas/panel.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestSchema } from './schemas/test.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Panel.name, schema: PanelSchema },
      { name: Test.name, schema: TestSchema },
    ]),
  ],
  controllers: [PanelsController],
  providers: [PanelsService],
})
export class PanelsModule {}
