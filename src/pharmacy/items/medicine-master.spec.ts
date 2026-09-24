import { UserRole } from '../../users/schemas/user.schema';
import { AddItemDto } from './dto/add-items.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

describe('Medicine master vs batch DTO', () => {
  it('accepts master create without batchNumber or expiryDate', async () => {
    const dto = plainToInstance(AddItemDto, {
      name: 'Amoxicillin',
      category: 'Medicine',
      unitPrice: 10,
      mrp: 12,
      purchasePrice: 8,
      openingStockQuantity: 0,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts optional batch fields for opening stock path', async () => {
    const dto = plainToInstance(AddItemDto, {
      name: 'Amoxicillin',
      category: 'Medicine',
      unitPrice: 10,
      mrp: 12,
      purchasePrice: 8,
      batchNumber: 'B1',
      expiryDate: '2027-01-01',
      openingStockQuantity: 100,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

describe('Super Admin role enum', () => {
  it('includes Super Admin as a distinct JWT role', () => {
    expect(UserRole.SUPER_ADMIN).toBe('Super Admin');
    expect(Object.values(UserRole)).toContain('Super Admin');
    expect(Object.values(UserRole)).toContain('Pharmacy');
  });
});
