import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { Procedure, ProcedureDocument } from './schemas/procedure.schema';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';
import { SubProcedureDto } from './dto/sub-procedure.dto';

export interface ResolvedProcedureItem {
  procedureId: Types.ObjectId;
  subProcedureId?: string | null;
  name: string;
  parentName?: string | null;
  price: number;
  code?: string | null;
}

@Injectable()
export class ProcedureService {
  constructor(
    @InjectModel(Procedure.name)
    private procedureModel: Model<ProcedureDocument>,
  ) {}

  async createProcedure(dto: CreateProcedureDto) {
    // If subProcedures are provided, ensure hasSubProcedures is true
    const hasSubs =
      dto.hasSubProcedures ||
      (Array.isArray(dto.subProcedures) && dto.subProcedures.length > 0);

    const procedure = new this.procedureModel({
      ...dto,
      hasSubProcedures: Boolean(hasSubs),
      subProcedures: (dto.subProcedures || []).map((sp) => ({
        ...sp,
        _id: sp._id && mongoose.isValidObjectId(sp._id) ? new Types.ObjectId(sp._id) : new Types.ObjectId(),
        isDeleted: sp.isDeleted ?? false,
        status: sp.status || 'Active',
      })),
    });

    return await procedure.save();
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
        { 'subProcedures.name': searchRegex },
        { 'subProcedures.code': searchRegex },
        { 'subProcedures.description': searchRegex },
      ];
    }

    const procedures = await this.procedureModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Filter out deleted sub-procedures in results
    return procedures.map((p) => ({
      ...p,
      subProcedures: (p.subProcedures || []).filter((sp: any) => !sp.isDeleted),
    }));
  }

  async findOne(id: string): Promise<any> {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid procedure ID: ${id}`);
    }

    const procedure = await this.procedureModel
      .findOne({ _id: id, isDeleted: false })
      .lean()
      .exec();

    if (!procedure) {
      throw new NotFoundException(`Procedure with id ${id} not found`);
    }

    return {
      ...procedure,
      subProcedures: (procedure.subProcedures || []).filter(
        (sp: any) => !sp.isDeleted,
      ),
    };
  }

  async updateProcedure(id: string, dto: UpdateProcedureDto) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid procedure ID: ${id}`);
    }

    const existing = await this.procedureModel.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!existing) {
      throw new NotFoundException(`Procedure with id ${id} not found`);
    }

    if (dto.name !== undefined) existing.name = dto.name;
    if (dto.code !== undefined) existing.code = dto.code;
    if (dto.description !== undefined) existing.description = dto.description;
    if (dto.price !== undefined) existing.price = dto.price;
    if (dto.status !== undefined) existing.status = dto.status;
    if (dto.hasSubProcedures !== undefined)
      existing.hasSubProcedures = dto.hasSubProcedures;

    if (Array.isArray(dto.subProcedures)) {
      existing.subProcedures = dto.subProcedures.map((sp) => ({
        ...sp,
        _id:
          sp._id && mongoose.isValidObjectId(sp._id)
            ? new Types.ObjectId(sp._id)
            : new Types.ObjectId(),
        isDeleted: sp.isDeleted ?? false,
        status: sp.status || 'Active',
      })) as any;
      existing.hasSubProcedures = existing.subProcedures.length > 0;
    }

    return await existing.save();
  }

  async softDeleteProcedure(id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid procedure ID: ${id}`);
    }

    const procedure = await this.procedureModel.findOne({ _id: id });
    if (!procedure) {
      throw new NotFoundException(`Procedure with id ${id} not found`);
    }

    procedure.isDeleted = true;
    if (Array.isArray(procedure.subProcedures) && procedure.subProcedures.length > 0) {
      procedure.subProcedures.forEach((sp: any) => {
        sp.isDeleted = true;
      });
    }

    return await procedure.save();
  }

  async addSubProcedure(procedureId: string, dto: SubProcedureDto) {
    if (!mongoose.isValidObjectId(procedureId)) {
      throw new BadRequestException(`Invalid procedure ID: ${procedureId}`);
    }

    const newSubProc = {
      _id: new Types.ObjectId(),
      name: dto.name,
      price: dto.price,
      code: dto.code || undefined,
      description: dto.description || undefined,
      status: dto.status || 'Active',
      isDeleted: false,
    };

    const procedure = await this.procedureModel
      .findOneAndUpdate(
        { _id: procedureId, isDeleted: false },
        {
          $push: { subProcedures: newSubProc },
          $set: { hasSubProcedures: true },
        },
        { new: true },
      )
      .exec();

    if (!procedure) {
      throw new NotFoundException(`Procedure with id ${procedureId} not found`);
    }

    return procedure;
  }

  async updateSubProcedure(
    procedureId: string,
    subProcId: string,
    dto: Partial<SubProcedureDto>,
  ) {
    if (
      !mongoose.isValidObjectId(procedureId) ||
      !mongoose.isValidObjectId(subProcId)
    ) {
      throw new BadRequestException('Invalid procedure or sub-procedure ID');
    }

    const updateFields: any = {};
    if (dto.name !== undefined)
      updateFields['subProcedures.$.name'] = dto.name;
    if (dto.price !== undefined)
      updateFields['subProcedures.$.price'] = dto.price;
    if (dto.code !== undefined)
      updateFields['subProcedures.$.code'] = dto.code;
    if (dto.description !== undefined)
      updateFields['subProcedures.$.description'] = dto.description;
    if (dto.status !== undefined)
      updateFields['subProcedures.$.status'] = dto.status;
    if (dto.isDeleted !== undefined)
      updateFields['subProcedures.$.isDeleted'] = dto.isDeleted;

    const procedure = await this.procedureModel
      .findOneAndUpdate(
        {
          _id: procedureId,
          isDeleted: false,
          'subProcedures._id': new Types.ObjectId(subProcId),
        },
        { $set: updateFields },
        { new: true },
      )
      .exec();

    if (!procedure) {
      throw new NotFoundException(
        `Sub-procedure with id ${subProcId} in procedure ${procedureId} not found`,
      );
    }

    return procedure;
  }

  async softDeleteSubProcedure(procedureId: string, subProcId: string) {
    return await this.updateSubProcedure(procedureId, subProcId, {
      isDeleted: true,
    });
  }

  /**
   * Helper to resolve any array of procedure items / IDs from Doctor Consultation
   */
  async resolveProcedureItems(items: any[]): Promise<ResolvedProcedureItem[]> {
    if (!Array.isArray(items) || items.length === 0) {
      return [];
    }

    // Fetch all active procedures
    const allProcedures = await this.procedureModel
      .find({ isDeleted: false })
      .lean()
      .exec();

    const resolved: ResolvedProcedureItem[] = [];

    for (const item of items) {
      if (!item) continue;

      let targetId: string = '';
      if (typeof item === 'string') {
        targetId = item.trim();
      } else if (typeof item === 'object') {
        targetId =
          item.subProcedureId ||
          item.procedureId ||
          item._id ||
          '';
      }

      if (!targetId) continue;

      // 1. Check if targetId matches a sub-procedure
      let foundAsSub = false;
      for (const p of allProcedures) {
        const sub = (p.subProcedures || []).find(
          (sp: any) => String(sp._id) === String(targetId) && !sp.isDeleted,
        );
        if (sub) {
          resolved.push({
            procedureId: p._id as Types.ObjectId,
            subProcedureId: String(sub._id),
            name: sub.name,
            parentName: p.name,
            price: Number(sub.price) || 0,
            code: sub.code || p.code || null,
          });
          foundAsSub = true;
          break;
        }
      }

      if (foundAsSub) continue;

      // 2. Check if targetId matches a main standalone procedure
      const mainProc = allProcedures.find(
        (p) => String(p._id) === String(targetId),
      );
      if (mainProc) {
        resolved.push({
          procedureId: mainProc._id as Types.ObjectId,
          subProcedureId: null,
          name: mainProc.name,
          parentName: null,
          price: Number(mainProc.price) || 0,
          code: mainProc.code || null,
        });
      } else if (typeof item === 'object' && item.name && item.price !== undefined) {
        // Fallback for custom or direct objects
        resolved.push({
          procedureId:
            item.procedureId && mongoose.isValidObjectId(item.procedureId)
              ? new Types.ObjectId(item.procedureId)
              : new Types.ObjectId(),
          subProcedureId: item.subProcedureId || null,
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
