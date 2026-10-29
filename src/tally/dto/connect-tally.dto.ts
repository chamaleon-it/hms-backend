import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class ConnectTallyDto {
  @IsString()
  @MinLength(1)
  host: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  port: number;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  cashLedger?: string;

  @IsOptional()
  @IsString()
  upiLedger?: string;

  @IsOptional()
  @IsString()
  cardLedger?: string;

  @IsOptional()
  @IsString()
  salesLedger?: string;

  @IsOptional()
  @IsString()
  expenseLedger?: string;

  @IsOptional()
  @IsString()
  pharmacyPaymentLedger?: string;

  @IsOptional()
  @IsString()
  therapyReceiptLedger?: string;

  @IsOptional()
  @IsString()
  therapyPaymentLedger?: string;

  @IsOptional()
  @IsString()
  receptionReceiptLedger?: string;

  @IsOptional()
  @IsString()
  receptionPaymentLedger?: string;

  @IsOptional()
  @IsString()
  purchasePaymentLedger?: string;
}
