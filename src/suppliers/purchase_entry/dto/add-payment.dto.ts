import { IsNotEmpty, IsNumber } from "class-validator";

export class AddPaymentDto {

    @IsNumber()
    @IsNotEmpty()
    paidAmount: number


}