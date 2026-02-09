import { IsNotEmpty, IsMongoId, IsString, IsDateString, IsBoolean, IsOptional, IsArray, IsNumber } from "class-validator";
import mongoose from "mongoose";

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
    @IsNotEmpty()
    items: Array<{
        item: mongoose.Types.ObjectId,
        batch: string,
        quantity: number,
        pack: number,
        unitPrice: number,
        expiryDate: Date,
        purchasePrice: number,
        gst: number,
        discount: number,
        free: number
    }>

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

    @IsString()
    @IsOptional()
    description?: string

}