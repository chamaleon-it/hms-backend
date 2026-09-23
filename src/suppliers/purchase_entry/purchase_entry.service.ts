import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { PaymentStatus, PurchaseEntry } from './schemas/purchase-entry.schema';
import { CreatePurchaseEntryDto } from './dto/create-purchase-entry.dto';
import { ItemsService } from 'src/pharmacy/items/items.service';
import { Supplier } from '../schemas/supplier.schema';
import { AddPaymentDto } from './dto/add-payment.dto';
import { SupplierBulkPaymentDto } from './dto/supplier-bulk-payment.dto';

@Injectable()
export class PurchaseEntryService {
  constructor(
    @InjectModel(PurchaseEntry.name)
    private purchaseEntryModel: Model<PurchaseEntry>,
    private readonly itemsService: ItemsService,
    @InjectModel(Supplier.name) private supplierModel: Model<Supplier>,
  ) {}

  private resolvePaymentStatus(paidAmount: number, total: number): PaymentStatus {
    if (paidAmount <= 0) return PaymentStatus.PENDING;
    if (paidAmount + 1e-9 >= total) return PaymentStatus.PAID;
    return PaymentStatus.PARTIALLY_PAID;
  }

  async create(createPurchaseEntryDto: CreatePurchaseEntryDto) {
    if (createPurchaseEntryDto.transportCharge == null) {
      createPurchaseEntryDto.transportCharge = 0;
    }
    if (createPurchaseEntryDto.paidAmount > createPurchaseEntryDto.total) {
      throw new BadRequestException('Paid Amount is greater than Total Amount');
    }

    const supplierCheck = await this.supplierModel
      .findById(createPurchaseEntryDto.supplier)
      .exec();
    if (
      !supplierCheck ||
      supplierCheck.isDeleted ||
      supplierCheck.status === 'Inactive'
    ) {
      throw new BadRequestException(
        'Supplier is inactive or deleted and cannot receive new purchase entries',
      );
    }

    createPurchaseEntryDto.paymentStatus = this.resolvePaymentStatus(
      createPurchaseEntryDto.paidAmount ?? 0,
      createPurchaseEntryDto.total,
    );

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

  async findBySupplier(id: string) {
    return await this.purchaseEntryModel
      .find({ supplier: id })
      .populate('supplier', 'name paymentTerms balance')
      .populate('items.item', 'name generic hsnCode sku unitPrice')
      .exec();
  }

  async findById(id: string) {
    return await this.purchaseEntryModel
      .findById(id)
      .populate('supplier', 'name paymentTerms balance')
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
    data.paymentStatus = this.resolvePaymentStatus(data.paidAmount, data.total);
    return await data.save();
  }

  /**
   * Whole-amount supplier payment: FIFO allocate across outstanding invoices
   * (oldest invoiceDate first, then createdAt/_id). Blocks overpayment —
   * advances are not supported. Runs in a Mongo transaction.
   */
  async paySupplierOutstanding(
    supplierId: string,
    dto: SupplierBulkPaymentDto,
  ) {
    if (!mongoose.isValidObjectId(supplierId)) {
      throw new BadRequestException('Invalid supplier ID');
    }

    const supplier = await this.supplierModel.findById(supplierId).exec();
    if (!supplier || supplier.isDeleted) {
      throw new BadRequestException('Supplier not found');
    }

    const amount = Number(dto.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    const session = await this.purchaseEntryModel.db.startSession();
    session.startTransaction();
    try {
      const outstanding = await this.purchaseEntryModel
        .find({
          supplier: new mongoose.Types.ObjectId(supplierId),
          $expr: { $lt: ['$paidAmount', '$total'] },
        })
        .sort({ invoiceDate: 1, createdAt: 1, _id: 1 })
        .session(session);

      const totalOutstanding = outstanding.reduce(
        (sum, entry) => sum + Math.max(0, entry.total - entry.paidAmount),
        0,
      );

      const round2 = (n: number) => Math.round(n * 100) / 100;
      if (round2(amount) > round2(totalOutstanding) + 1e-6) {
        throw new BadRequestException(
          `Payment amount (₹${round2(amount)}) exceeds total outstanding (₹${round2(totalOutstanding)}). Advances are not supported.`,
        );
      }

      let remaining = round2(amount);
      const allocations: Array<{
        purchaseEntryId: string;
        invoiceNumber: string;
        allocated: number;
        paidAmount: number;
        total: number;
        paymentStatus: PaymentStatus;
      }> = [];

      for (const entry of outstanding) {
        if (remaining <= 0) break;
        const due = round2(entry.total - entry.paidAmount);
        if (due <= 0) continue;
        const allocated = Math.min(remaining, due);
        entry.paidAmount = round2(entry.paidAmount + allocated);
        entry.paymentStatus = this.resolvePaymentStatus(
          entry.paidAmount,
          entry.total,
        );
        await entry.save({ session });
        allocations.push({
          purchaseEntryId: String(entry._id),
          invoiceNumber: entry.invoiceNumber,
          allocated,
          paidAmount: entry.paidAmount,
          total: entry.total,
          paymentStatus: entry.paymentStatus,
        });
        remaining = round2(remaining - allocated);
      }

      const remainingOutstanding = round2(totalOutstanding - amount);
      supplier.balance = remainingOutstanding;
      await supplier.save({ session });

      await session.commitTransaction();

      return {
        supplierId,
        amountPaid: round2(amount),
        previousOutstanding: round2(totalOutstanding),
        remainingOutstanding,
        paymentRef: dto.paymentRef || null,
        allocations,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
