import { IsBoolean, IsNotEmpty, IsNumber } from "class-validator"

export class UpdateInventoryDto{
    
    @IsNumber({}, { message: "lowStockThreshold must be a number" })
    @IsNotEmpty({ message: "lowStockThreshold is required" })
    lowStockThreshold: number
    
    @IsNumber({}, { message: "expiryAlert must be a number" })
    @IsNotEmpty({ message: "expiryAlert is required" })
    expiryAlert: number

    @IsBoolean({ message: "allowNegativeStock must be a boolean" })
    @IsNotEmpty({ message: "allowNegativeStock is required" })
    allowNegativeStock: boolean
}
