import { Module } from '@nestjs/common';
import { PanelsService } from './panels.service';
import { PanelsController } from './panels.controller';
import { Panel, PanelSchema } from './schemas/panel.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: Panel.name, schema: PanelSchema }])],
  controllers: [PanelsController],
  providers: [PanelsService],
})
export class PanelsModule {}
