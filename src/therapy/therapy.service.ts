import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Therapy, TherapyDocument } from './schemas/therapy.schema';
import { CreateTherapyDto } from './dto/create-therapy.dto';
import { UpdateTherapyDto } from './dto/update-therapy.dto';
import { SubTherapyDto } from './dto/sub-therapy.dto';

export interface ResolvedTherapyItem {
  therapyId: Types.ObjectId;
  subTherapyId?: string | null;
  name: string;
  parentName?: string | null;
  price: number;
  code?: string | null;
}

@Injectable()
export class TherapyService {
  constructor(
    @InjectModel(Therapy.name) private therapyModel: Model<TherapyDocument>,
  ) {}

  async createTherapy(dto: CreateTherapyDto) {
    const hasSubs =
      dto.hasSubTherapies ||
      (Array.isArray(dto.subTherapies) && dto.subTherapies.length > 0);

    const therapy = new this.therapyModel({
      ...dto,
      hasSubTherapies: Boolean(hasSubs),
      subTherapies: (dto.subTherapies || []).map((st) => ({
        ...st,
        _id:
          st._id && mongoose.isValidObjectId(st._id)
            ? new Types.ObjectId(st._id)
            : new Types.ObjectId(),
        isDeleted: st.isDeleted ?? false,
        status: st.status || 'Active',
      })),
    });

    return await therapy.save();
  }

  async findAll(search?: string, status?: string): Promise<any[]> {
    const filter: any = { isDeleted: false };

    if (status && status !== 'all') {
      filter.status = { $regex: new RegExp(`^${status}$`, 'i') };
    }

    if (search && search.trim() !== '') {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { description: searchRegex },
        { 'subTherapies.name': searchRegex },
        { 'subTherapies.code': searchRegex },
        { 'subTherapies.description': searchRegex },
      ];
    }

    const therapies = await this.therapyModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Filter out deleted sub-therapies in results
    return therapies.map((t) => ({
      ...t,
      subTherapies: (t.subTherapies || []).filter((st: any) => !st.isDeleted),
    }));
  }

  async findOne(id: string): Promise<any> {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid therapy ID: ${id}`);
    }

    const therapy = await this.therapyModel
      .findOne({ _id: id, isDeleted: false })
      .lean()
      .exec();

    if (!therapy) {
      throw new NotFoundException(`Therapy with id ${id} not found`);
    }

    return {
      ...therapy,
      subTherapies: (therapy.subTherapies || []).filter(
        (st: any) => !st.isDeleted,
      ),
    };
  }

  async updateTherapy(id: string, dto: UpdateTherapyDto) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid therapy ID: ${id}`);
    }

    const existing = await this.therapyModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!existing) {
      throw new NotFoundException(`Therapy with id ${id} not found`);
    }

    if (dto.name !== undefined) existing.name = dto.name;
    if (dto.code !== undefined) existing.code = dto.code;
    if (dto.description !== undefined) existing.description = dto.description;
    if (dto.price !== undefined) existing.price = dto.price;
    if (dto.status !== undefined) existing.status = dto.status;
    if (dto.hasSubTherapies !== undefined)
      existing.hasSubTherapies = dto.hasSubTherapies;

    if (Array.isArray(dto.subTherapies)) {
      existing.subTherapies = dto.subTherapies.map((st) => ({
        ...st,
        _id:
          st._id && mongoose.isValidObjectId(st._id)
            ? new Types.ObjectId(st._id)
            : new Types.ObjectId(),
        isDeleted: st.isDeleted ?? false,
        status: st.status || 'Active',
      })) as any;
      existing.hasSubTherapies = existing.subTherapies.length > 0;
    }

    return await existing.save();
  }

  async softDeleteTherapy(id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid therapy ID: ${id}`);
    }

    const therapy = await this.therapyModel.findOne({ _id: id });
    if (!therapy) {
      throw new NotFoundException(`Therapy with id ${id} not found`);
    }

    therapy.isDeleted = true;
    if (Array.isArray(therapy.subTherapies) && therapy.subTherapies.length > 0) {
      therapy.subTherapies.forEach((st: any) => {
        st.isDeleted = true;
      });
    }

    return await therapy.save();
  }

  async addSubTherapy(therapyId: string, dto: SubTherapyDto) {
    if (!mongoose.isValidObjectId(therapyId)) {
      throw new BadRequestException(`Invalid therapy ID: ${therapyId}`);
    }

    const newSubTherapy = {
      _id: new Types.ObjectId(),
      name: dto.name,
      price: dto.price,
      code: dto.code || undefined,
      description: dto.description || undefined,
      status: dto.status || 'Active',
      isDeleted: false,
    };

    const therapy = await this.therapyModel
      .findOneAndUpdate(
        { _id: therapyId, isDeleted: false },
        {
          $push: { subTherapies: newSubTherapy },
          $set: { hasSubTherapies: true },
        },
        { new: true },
      )
      .exec();

    if (!therapy) {
      throw new NotFoundException(`Therapy with id ${therapyId} not found`);
    }

    return therapy;
  }

  async updateSubTherapy(
    therapyId: string,
    subTherapyId: string,
    dto: Partial<SubTherapyDto>,
  ) {
    if (
      !mongoose.isValidObjectId(therapyId) ||
      !mongoose.isValidObjectId(subTherapyId)
    ) {
      throw new BadRequestException('Invalid therapy or sub-therapy ID');
    }

    const updateFields: any = {};
    if (dto.name !== undefined)
      updateFields['subTherapies.$.name'] = dto.name;
    if (dto.price !== undefined)
      updateFields['subTherapies.$.price'] = dto.price;
    if (dto.code !== undefined)
      updateFields['subTherapies.$.code'] = dto.code;
    if (dto.description !== undefined)
      updateFields['subTherapies.$.description'] = dto.description;
    if (dto.status !== undefined)
      updateFields['subTherapies.$.status'] = dto.status;
    if (dto.isDeleted !== undefined)
      updateFields['subTherapies.$.isDeleted'] = dto.isDeleted;

    const therapy = await this.therapyModel
      .findOneAndUpdate(
        {
          _id: therapyId,
          isDeleted: false,
          'subTherapies._id': new Types.ObjectId(subTherapyId),
        },
        { $set: updateFields },
        { new: true },
      )
      .exec();

    if (!therapy) {
      throw new NotFoundException(
        `Sub-therapy with id ${subTherapyId} in therapy ${therapyId} not found`,
      );
    }

    return therapy;
  }

  async softDeleteSubTherapy(therapyId: string, subTherapyId: string) {
    return await this.updateSubTherapy(therapyId, subTherapyId, {
      isDeleted: true,
    });
  }

  /**
   * Helper to resolve any array of therapy items / IDs from Doctor Consultation
   */
  async resolveTherapyItems(items: any[]): Promise<ResolvedTherapyItem[]> {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    // Fetch all active therapies
    const allTherapies = await this.therapyModel
      .find({ isDeleted: false })
      .lean()
      .exec();

    const resolved: ResolvedTherapyItem[] = [];

    for (const item of items) {
      if (!item) continue;

      let targetId: string = '';
      if (typeof item === 'string') {
        targetId = item.trim();
      } else if (typeof item === 'object') {
        targetId =
          item.subTherapyId ||
          item.therapyId ||
          item._id ||
          '';
      }

      if (!targetId) continue;

      // 1. Check if targetId matches a sub-therapy
      let foundAsSub = false;
      for (const t of allTherapies) {
        const sub = (t.subTherapies || []).find(
          (st: any) => String(st._id) === String(targetId) && !st.isDeleted,
        );
        if (sub) {
          resolved.push({
            therapyId: t._id as Types.ObjectId,
            subTherapyId: String(sub._id),
            name: sub.name,
            parentName: t.name,
            price: Number(sub.price) || 0,
            code: sub.code || t.code || null,
          });
          foundAsSub = true;
          break;
        }
      }

      if (foundAsSub) continue;

      // 2. Check if targetId matches a main standalone therapy
      const mainTherapy = allTherapies.find(
        (t) => String(t._id) === String(targetId),
      );
      if (mainTherapy) {
        resolved.push({
          therapyId: mainTherapy._id as Types.ObjectId,
          subTherapyId: null,
          name: mainTherapy.name,
          parentName: null,
          price: Number(mainTherapy.price) || 0,
          code: mainTherapy.code || null,
        });
      } else if (typeof item === 'object' && item.name && item.price !== undefined) {
        // Fallback for custom or direct objects
        resolved.push({
          therapyId:
            item.therapyId && mongoose.isValidObjectId(item.therapyId)
              ? new Types.ObjectId(item.therapyId)
              : new Types.ObjectId(),
          subTherapyId: item.subTherapyId || null,
          name: item.name,
          parentName: item.parentName || null,
          price: Number(item.price) || 0,
          code: item.code || null,
        });
      }
    }

    return resolved;
  }
}
