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
    constructor(@InjectModel(PurchaseEntry.name) private purchaseEntryModel: Model<PurchaseEntry>, private readonly itemsService: ItemsService, @InjectModel(Supplier.name) private supplierModel: Model<Supplier>) { }

    async create(createPurchaseEntryDto: CreatePurchaseEntryDto) {

        if (createPurchaseEntryDto.paidAmount > createPurchaseEntryDto.total) {
            throw new BadRequestException("Paid Amount is greater than Total Amount");
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


        const data = await this.purchaseEntryModel.create(createPurchaseEntryDto)
        for (const item of createPurchaseEntryDto.items) {
            const supplier = await this.supplierModel.findById(createPurchaseEntryDto.supplier).exec();
            await this.itemsService.addBatchItems(item.item, {
                batchNumber: item.batch,
                quantity: item.quantity,
                expiryDate: item.expiryDate,
                purchasePrice: item.purchasePrice,
                supplier: supplier?.name || "-",
            })
        }
        return data;
    }

    async findBySupplier(id: string) {
        return await this.purchaseEntryModel.find({ supplier: id }).populate("supplier", "name paymentTerms balance").populate("items.item", "name generic hsnCode sku unitPrice").exec();
    }

    async findById(id: string) {
        return await this.purchaseEntryModel.findById(id).populate("supplier", "name paymentTerms balance").populate("items.item", "name generic hsnCode sku unitPrice").exec();
    }

    async addPayment(id: string, addPaymentDto: AddPaymentDto) {
        const data = await this.purchaseEntryModel.findById(id).exec();
        if (!data) {
            throw new BadRequestException("Purchase Entry Not Found");
        }
        if (data.paidAmount + addPaymentDto.paidAmount > data.total) {
            throw new BadRequestException("Paid Amount is greater than Total Amount");
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
