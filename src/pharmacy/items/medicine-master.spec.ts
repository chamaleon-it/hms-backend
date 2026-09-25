import { UserRole } from '../../users/schemas/user.schema';
import { AddItemDto } from './dto/add-items.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

describe('Medicine master vs batch DTO', () => {
  it('accepts master create without pricing or batch fields', async () => {
    const dto = plainToInstance(AddItemDto, {
      name: 'Amoxicillin',
      category: 'Medicine',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts optional opening-batch fields', async () => {
    const dto = plainToInstance(AddItemDto, {
      name: 'Amoxicillin',
      category: 'Medicine',
      unitPrice: 10,
      mrp: 12,
      purchaseRate: 8,
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
