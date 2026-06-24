import { PartialType } from '@nestjs/mapped-types';
import { RegisterSupplierDto } from './register-supplier.dto';

export class UpdateSupplierDto extends PartialType(RegisterSupplierDto) {}
