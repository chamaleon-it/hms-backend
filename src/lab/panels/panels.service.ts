import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePanelDto } from './dto/create-panel.dto';
import { Panel, PanelStatus } from './schemas/panel.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PanelsService {
  constructor(@InjectModel(Panel.name) private panelModel: Model<Panel>) {}

  async createPanel(createPanelDto: CreatePanelDto) {
    const isExist = await this.panelModel.findOne({
      name: createPanelDto.name,
    });
    if (isExist) {
      throw new BadRequestException('Panel with this name already exists');
    }
    const panel = new this.panelModel(createPanelDto);
    return panel.save();
  }

  async getPanels(): Promise<string[]> {
    const panels = await this.panelModel
      .find({ status: PanelStatus.ACTIVE })
      .select('name -_id')
      .sort({ _id: 1 })
      .lean()
      .exec();
    return panels.map((panel) => panel.name);
  }

  async deletePanel(name: string) {
    await this.panelModel.findOneAndUpdate(
      { name },
      { status: PanelStatus.DELETED },
    );
  }
}
