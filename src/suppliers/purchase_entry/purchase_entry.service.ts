import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PurchaseEntry } from './schemas/purchase-entry.schema';
import { CreatePurchaseEntryDto } from './dto/create-purchase-entry.dto';
import { ItemsService } from 'src/pharmacy/items/items.service';
import { Supplier } from '../schemas/supplier.schema';

@Injectable()
export class PurchaseEntryService {
    constructor(@InjectModel(PurchaseEntry.name) private purchaseEntryModel: Model<PurchaseEntry>, private readonly itemsService: ItemsService, @InjectModel(Supplier.name) private supplierModel: Model<Supplier>) { }

    async create(createPurchaseEntryDto: CreatePurchaseEntryDto) {
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


}
