import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { PaymentStatus, PurchaseEntry } from './schemas/purchase-entry.schema';
import { CreatePurchaseEntryDto } from './dto/create-purchase-entry.dto';
import { ItemsService } from 'src/pharmacy/items/items.service';
import { Supplier } from '../schemas/supplier.schema';
import { AddPaymentDto } from './dto/add-payment.dto';
import { RecordSupplierPaymentDto } from './dto/record-supplier-payment.dto';
import { SupplierPayment } from './schemas/supplier-payment.schema';
import {
  SupplierPaymentError,
  SupplierPaymentPlan,
  dueAmount,
  compareOpenInvoices,
  planSupplierPayment,
} from './supplier-payment.allocation';

@Injectable()
export class PurchaseEntryService {
  constructor(
    @InjectModel(PurchaseEntry.name)
    private purchaseEntryModel: Model<PurchaseEntry>,
    private readonly itemsService: ItemsService,
    @InjectModel(Supplier.name) private supplierModel: Model<Supplier>,
    @InjectModel(SupplierPayment.name)
    private supplierPaymentModel: Model<SupplierPayment>,
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

    const { grossAmount: _grossAmount, ...entryPayload } =
      createPurchaseEntryDto as CreatePurchaseEntryDto & {
        grossAmount?: number;
      };

    const data = await this.purchaseEntryModel.create(entryPayload);
    for (const item of createPurchaseEntryDto.items) {
      const supplier = await this.supplierModel
        .findById(createPurchaseEntryDto.supplier)
        .exec();

      // Purchase line quantity = paid packs; inventory needs total units
      // including free/schema packs: (paidPacks + freePacks) × packSize
      const paidPacks =
        item.noOfPack != null && item.noOfPack !== undefined
          ? Number(item.noOfPack)
          : Number(item.quantity) || 0;
      const freePacks = Number(item.free) || 0;
      const packSize = Number(item.pack) || 1;
      const stockUnits = (paidPacks + freePacks) * packSize;

      await this.itemsService.addBatchItems(
        item.item,
        {
          batchNumber: item.batch,
          quantity: stockUnits,
          expiryDate: item.expiryDate,
          purchasePrice: item.purchasePrice,
          supplier: supplier?.name || '-',
          unitPrice: item.pack ? item.unitPrice / item.pack : item.unitPrice,
          mrp: item.unitPrice,
          packing: item.pack,
          stripCount: paidPacks,
        },
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

  async listOpenInvoices(supplierId: string) {
    await this.requireSupplier(supplierId);
    const entries = await this.purchaseEntryModel
      .find({ supplier: supplierId })
      .select('invoiceNumber invoiceDate total paidAmount paymentStatus')
      .exec();

    const invoices = entries
      .map((entry) => ({
        _id: String(entry._id),
        invoiceNumber: entry.invoiceNumber,
        invoiceDate: entry.invoiceDate,
        total: entry.total,
        paidAmount: entry.paidAmount || 0,
        dueAmount: dueAmount(entry.total, entry.paidAmount || 0),
      }))
      .filter((entry) => entry.dueAmount > 0)
      .sort(compareOpenInvoices);

    const totalDue =
      invoices.reduce(
        (sum, entry) => sum + Math.round(entry.dueAmount * 100),
        0,
      ) / 100;

    return { invoices, totalDue };
  }

  /**
   * Stores one supplier payment and applies it to open purchase bills.
   * Supplier Total Due is the sum of bill totals minus paid amounts, so
   * only those bill fields change. Purchase totals stay as recorded.
   */
  async recordSupplierPayment(
    supplierId: string,
    dto: RecordSupplierPaymentDto,
  ) {
    await this.requireSupplier(supplierId);
    const entries = await this.purchaseEntryModel
      .find({ supplier: supplierId })
      .exec();

    let plan: SupplierPaymentPlan;
    try {
      plan = planSupplierPayment(
        entries.map((entry) => ({
          id: String(entry._id),
          invoiceNumber: entry.invoiceNumber,
          invoiceDate: entry.invoiceDate,
          total: entry.total,
          paidAmount: entry.paidAmount || 0,
          paymentStatus: entry.paymentStatus,
        })),
        {
          cash: dto.cash ?? 0,
          card: dto.card ?? 0,
          upi: dto.upi ?? 0,
        },
      );
    } catch (error) {
      if (error instanceof SupplierPaymentError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    const applied: typeof plan.updates = [];
    try {
      for (const update of plan.updates) {
        const result = await this.purchaseEntryModel.updateOne(
          { _id: update.id, paidAmount: update.previousPaidAmount },
          {
            $set: {
              paidAmount: update.paidAmount,
              paymentStatus: update.paymentStatus,
            },
          },
        );
        if (result.matchedCount !== 1) {
          throw new ConflictException(
            'An invoice changed while recording this payment. Please try again.',
          );
        }
        applied.push(update);
      }

      return await this.supplierPaymentModel.create({
        supplier: supplierId,
        cash: plan.cash,
        card: plan.card,
        upi: plan.upi,
        total: plan.total,
        date: new Date(),
        allocations: plan.allocations.map((allocation) => ({
          purchaseEntry: allocation.purchaseEntryId,
          invoiceNumber: allocation.invoiceNumber,
          amount: allocation.amount,
        })),
      });
    } catch (error) {
      for (const update of [...applied].reverse()) {
        await this.purchaseEntryModel.updateOne(
          { _id: update.id, paidAmount: update.paidAmount },
          {
            $set: {
              paidAmount: update.previousPaidAmount,
              paymentStatus: update.previousPaymentStatus,
            },
          },
        );
      }
      throw error;
    }
  }

  private async requireSupplier(supplierId: string) {
    if (!mongoose.isValidObjectId(supplierId)) {
      throw new BadRequestException('Invalid supplier');
    }
    const supplier = await this.supplierModel.findById(supplierId).exec();
    if (!supplier || supplier.isDeleted) {
      throw new NotFoundException('Supplier not found');
    }
    return supplier;
  }
}
