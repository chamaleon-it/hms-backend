import { IsNotEmpty, IsMongoId, IsString, IsDateString, IsBoolean, IsOptional, IsArray, IsNumber, ArrayNotEmpty, ValidateNested, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import mongoose from "mongoose";
import { PaymentStatus } from "../schemas/purchase-entry.schema";

export class PurchaseItemDto {
    @IsMongoId()
    @IsNotEmpty()
    item: mongoose.Types.ObjectId;

    @IsString()
    @IsNotEmpty()
    batch: string;

    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    @IsNumber()
    @IsNotEmpty()
    pack: number;

    @IsNumber()
    @IsNotEmpty()
    unitPrice: number;

    @IsDateString()
    @IsNotEmpty()
    expiryDate: Date;

    @IsNumber()
    @IsNotEmpty()
    purchasePrice: number;

    @IsNumber()
    @IsNotEmpty()
    gst: number;

    @IsNumber()
    @IsNotEmpty()
    discount: number;

    @IsNumber()
    @IsNotEmpty()
    free: number;
}

export class CreatePurchaseEntryDto {
    @IsMongoId()
    @IsNotEmpty()
    supplier: mongoose.Types.ObjectId;

    @IsString()
    @IsNotEmpty()
    invoiceNumber: string

    @IsDateString()
    @IsNotEmpty()
    invoiceDate: Date

    @IsBoolean()
    @IsOptional()
    gstEnabled?: boolean

    @IsBoolean()
    @IsOptional()
    tscEnabled?: boolean

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => PurchaseItemDto)
    items: PurchaseItemDto[];

    @IsNumber()
    @IsNotEmpty()
    subTotal: number

    @IsNumber()
    @IsNotEmpty()
    discount: number

    @IsNumber()
    @IsNotEmpty()
    gst: number

    @IsNumber()
    @IsNotEmpty()
    transportCharge: number

    @IsNumber()
    @IsNotEmpty()
    total: number

    @IsNumber()
    @IsOptional()
    paidAmount: number

    @IsString()
    @IsOptional()
    description?: string

    @IsEnum(PaymentStatus)
    @IsOptional()
    paymentStatus?: PaymentStatus

}