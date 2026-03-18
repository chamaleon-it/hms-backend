import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePanelDto } from './dto/create-panel.dto';
import { Panel, PanelStatus } from './schemas/panel.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateTestDto } from './dto/create-test.dto';
import { Test } from './schemas/test.schema';
import { AddTestDto } from './dto/add-test.dto';

@Injectable()
export class PanelsService {
  constructor(
    @InjectModel(Panel.name) private panelModel: Model<Panel>,
    @InjectModel(Test.name) private testModel: Model<Test>,
  ) {}

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

  async getPanels() {
    const panels = await this.panelModel
      .find({ status: PanelStatus.ACTIVE })
      .select('name price estimatedTime tests')
      .populate('tests', 'name')
      .sort({ _id: 1 })
      .lean()
      .exec();
    return panels.map((panel) => ({ name: panel.name, price: panel.price, estimatedTime: panel.estimatedTime, tests: panel.tests }));
  }

  async updatePanel(name: string, updatePanelDto: CreatePanelDto) {
    const isExist = await this.panelModel.findOne({ name });
    if (!isExist) {
        throw new BadRequestException('Panel not found');
    }

    const { tests, ...rest } = updatePanelDto;
    
    // First update panel document mapping
    const panel = await this.panelModel.findOneAndUpdate(
        { name },
        { ...rest, tests: tests || [] },
        { new: true }
    );

    if (!panel) {
        throw new BadRequestException('Panel not found');
    }

    // Update reverse mapping of tests to ensure synchronization
    if (tests) {
        // Find existing tests with this panel
        const testDocs = await this.testModel.find({ panels: panel._id });
        
        // Remove panel from tests that are no longer in the payload
        for (const t of testDocs) {
            if (!tests.includes(t._id.toString())) {
                t.panels = t.panels.filter(pId => pId.toString() !== panel._id.toString());
                await t.save();
            }
        }
    
        // Add panel to tests that are in the payload but don't have the panel
        for (const testId of tests) {
            const testDoc = await this.testModel.findById(testId);
            if (testDoc && (!testDoc.panels || !testDoc.panels.includes(panel._id))) {
                if (!testDoc.panels) testDoc.panels = [];
                testDoc.panels.push(panel._id);
                await testDoc.save();
            }
        }
    }

    return panel;
  }

  async deletePanel(name: string) {
    await this.panelModel.findOneAndUpdate(
      { name },
      { status: PanelStatus.DELETED },
    );
  }

  async createTest(dto: CreateTestDto) {
    const isExist = await this.testModel.exists({ code: dto.code });
    if (isExist) {
      throw new BadRequestException('Test with this code already exists');
    }
    const test = await this.testModel.create(dto);
    return test;
  }

  async getTests() {
    const tests = await this.testModel
      .find()
      .populate('panels', 'name')
      .lean()
      .exec();
    return tests;
  }

  async updateTest(id: mongoose.Types.ObjectId, dto: CreateTestDto) {
    const test = await this.testModel.findByIdAndUpdate(id, dto, { new: true });
    return test;
  }

  async addTestToPanel(addTestDto: AddTestDto) {
    const panel = await this.panelModel.findOne({ name: addTestDto.panelName });
    if (!panel) {
      throw new BadRequestException('Panel not found');
    }

    for (const testId of addTestDto.tests) {
      const test = await this.testModel.findById(testId);
      if (!test) {
        throw new BadRequestException(
          `Test with id ${testId.toString()} not found`,
        );
      }
      if (!test.panels) {
        test.panels = [];
      }
      if (!test.panels.includes(panel._id)) {
        test.panels.push(panel._id);
        await test.save();
      }
    }
    return panel;
  }

  async removeTestFromPanel(addTestDto: AddTestDto) {
    const panel = await this.panelModel.findOne({ name: addTestDto.panelName });
    if (!panel) {
      throw new BadRequestException('Panel not found');
    }

    for (const testId of addTestDto.tests) {
      const test = await this.testModel.findById(testId);
      if (!test) {
        throw new BadRequestException(
          `Test with id ${testId.toString()} not found`,
        );
      }
      if (test.panels && test.panels.includes(panel._id)) {
        test.panels = test.panels.filter(
          (panelId) => !panelId.equals(panel._id),
        );
        await test.save();
      }
    }
    return panel;
  }

  async deleteTest(id: mongoose.Types.ObjectId) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID provided.');
    }
    const test = await this.testModel.findByIdAndDelete(id);
    if (!test) {
      throw new NotFoundException('Test not found.');
    }
    // Remove test from all panels
    await this.panelModel.updateMany(
      { tests: id },
      { $pull: { tests: id } },
    );
    return test;
  }
}
