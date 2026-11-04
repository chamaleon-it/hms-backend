import { AccountsService } from './accounts.service';

describe('AccountsService.billTallySyncStatuses', () => {
  it('uses linked transactions and legacy invoice descriptions without prefix collisions', async () => {
    const transactions = [
      { description: 'Reception Bill #INV-00014', tallySynced: true },
      { description: 'Reception Bill #INV-000140', tallySynced: false },
      {
        billingId: 'bill-2',
        description: 'Edited account entry',
        tallySynced: true,
      },
      {
        billingId: 'bill-2',
        description: 'Reception Payment for Bill #INV-00015',
        tallySynced: false,
      },
    ];
    const query = {
      select: () => query,
      lean: () => query,
      exec: () => transactions,
    };
    const model = { find: jest.fn(() => query) };
    const service = new AccountsService(model as never);

    const statuses = await service.billTallySyncStatuses([
      { _id: 'bill-1', mrn: 'INV-00014' },
      { _id: 'bill-2', mrn: 'INV-00015' },
      { _id: 'bill-3', mrn: 'INV-00016' },
      { _id: 'bill-4', mrn: 'INV-000140' },
    ]);

    expect(statuses.get('bill-1')).toBe(true);
    expect(statuses.get('bill-2')).toBe(false);
    expect(statuses.get('bill-3')).toBe(false);
    expect(statuses.get('bill-4')).toBe(false);
    expect(model.find).toHaveBeenCalledWith(
      expect.objectContaining({ isDeleted: { $ne: true } }),
    );
  });
});
