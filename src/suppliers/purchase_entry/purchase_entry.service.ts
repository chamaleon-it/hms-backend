import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentStatus, PurchaseEntry } from './schemas/purchase-entry.schema';
import { CreatePurchaseEntryDto } from './dto/create-purchase-entry.dto';
import { ItemsService } from 'src/pharmacy/items/items.service';
import { Supplier } from '../schemas/supplier.schema';
import { AddPaymentDto } from './dto/add-payment.dto';

@Injectable()
export class PurchaseEntryService {
  constructor(
    @InjectModel(PurchaseEntry.name)
    private purchaseEntryModel: Model<PurchaseEntry>,
    private readonly itemsService: ItemsService,
    @InjectModel(Supplier.name) private supplierModel: Model<Supplier>,
  ) {}

  async create(createPurchaseEntryDto: CreatePurchaseEntryDto) {
    if (createPurchaseEntryDto.paidAmount > createPurchaseEntryDto.total) {
      throw new BadRequestException('Paid Amount is greater than Total Amount');
    }
    if (createPurchaseEntryDto.paidAmount < createPurchaseEntryDto.total) {
      createPurchaseEntryDto.paymentStatus = PaymentStatus.PARTIALLY_PAID;
    }
    if (createPurchaseEntryDto.paidAmount === createPurchaseEntryDto.total) {
      createPurchaseEntryDto.paymentStatus = PaymentStatus.PAID;
    }
    if (createPurchaseEntryDto.paidAmount === 0) {
      createPurchaseEntryDto.paymentStatus = PaymentStatus.PENDING;
    }

    const data = await this.purchaseEntryModel.create(createPurchaseEntryDto);
    for (const item of createPurchaseEntryDto.items) {
      const supplier = await this.supplierModel
        .findById(createPurchaseEntryDto.supplier)
        .exec();

      await this.itemsService.addBatchItems(
        item.item,
        {
          batchNumber: item.batch,
          quantity: item.quantity,
          expiryDate: item.expiryDate,
          purchasePrice: item.purchasePrice,
          supplier: supplier?.name || '-',
        },
        item.unitPrice / item.pack,
        item.unitPrice,
      );
    }
    return data;
  }

  async findAll(query?: {
    search?: string;
    status?: string;
    supplier?: string;
    startDate?: string;
    endDate?: string;
    page?: number | string;
    limit?: number | string;
  }) {
    const filter: any = {};
    if (query?.supplier) {
      filter.supplier = query.supplier;
    }
    if (query?.status && query.status !== 'all') {
      filter.paymentStatus = query.status;
    }
    if (query?.search && query.search.trim()) {
      filter.invoiceNumber = { $regex: query.search.trim(), $options: 'i' };
    }
    if (query?.startDate || query?.endDate) {
      const dateCond: any = {};
      if (query.startDate) dateCond.$gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        if (typeof query.endDate === 'string' && query.endDate.length <= 10) {
          end.setHours(23, 59, 59, 999);
        }
        dateCond.$lte = end;
      }
      filter.$or = [
        { invoiceDate: dateCond },
        { createdAt: dateCond },
      ];
    }

    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Number(query?.limit) || 10);
    const skip = (page - 1) * limit;

    const total = await this.purchaseEntryModel.countDocuments(filter).exec();

    // Calculate summary statistics across matching entries
    const summaryAgg = await this.purchaseEntryModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$total' },
          totalPaid: { $sum: '$paidAmount' },
        },
      },
    ]);

    const stats = {
      totalEntries: total,
      totalValue: summaryAgg[0]?.totalValue || 0,
      totalPaid: summaryAgg[0]?.totalPaid || 0,
      totalDue: Math.max(0, (summaryAgg[0]?.totalValue || 0) - (summaryAgg[0]?.totalPaid || 0)),
    };

    const data = await this.purchaseEntryModel
      .find(filter)
      .populate('supplier', 'name phone contactPerson email gstin address paymentTerms balance')
      .populate('items.item', 'name generic hsnCode sku unitPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats,
    };
  }

  async findBySupplier(id: string) {
    return await this.purchaseEntryModel
      .find({ supplier: id })
      .populate('supplier', 'name phone contactPerson email gstin address paymentTerms balance')
      .populate('items.item', 'name generic hsnCode sku unitPrice')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string) {
    return await this.purchaseEntryModel
      .findById(id)
      .populate('supplier', 'name phone contactPerson email gstin address paymentTerms balance')
      .populate('items.item', 'name generic hsnCode sku unitPrice')
      .exec();
  }

  async addPayment(id: string, addPaymentDto: AddPaymentDto) {
    const data = await this.purchaseEntryModel.findById(id).exec();
    if (!data) {
      throw new BadRequestException('Purchase Entry Not Found');
    }
    if (data.paidAmount + addPaymentDto.paidAmount > data.total) {
      throw new BadRequestException('Paid Amount is greater than Total Amount');
    }
    data.paidAmount += addPaymentDto.paidAmount;
    if (data.paidAmount === data.total) {
      data.paymentStatus = PaymentStatus.PAID;
    }
    if (data.paidAmount < data.total) {
      data.paymentStatus = PaymentStatus.PARTIALLY_PAID;
    }
    return await data.save();
  }
}
