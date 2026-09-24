import { COUNTER_KEYS, CountersService } from './counters.service';

describe('CountersService', () => {
  const makeService = (store: Map<string, { key: string; seq: number }>) => {
    const service = Object.create(CountersService.prototype) as CountersService;
    (service as any).counterModel = {
      findOne: jest.fn(({ key }: { key: string }) => ({
        lean: () => ({
          exec: async () => (store.has(key) ? { ...store.get(key)! } : null),
        }),
      })),
      create: jest.fn(async (doc: { key: string; seq: number }) => {
        if (store.has(doc.key)) {
          const err: any = new Error('duplicate');
          err.code = 11000;
          throw err;
        }
        store.set(doc.key, { ...doc });
        return doc;
      }),
      findOneAndUpdate: jest.fn(
        (
          { key }: { key: string },
          update: { $inc: { seq: number } },
          opts: { new?: boolean; upsert?: boolean },
        ) => ({
          lean: () => ({
            exec: async () => {
              const cur = store.get(key);
              if (!cur) {
                if (opts?.upsert) {
                  const seq = update.$inc.seq;
                  store.set(key, { key, seq });
                  return { key, seq };
                }
                return null;
              }
              cur.seq += update.$inc.seq;
              store.set(key, cur);
              return { ...cur };
            },
          }),
        }),
      ),
    };
    return service;
  };

  it('seeds from initial max then increments', async () => {
    const store = new Map<string, { key: string; seq: number }>();
    const service = makeService(store);
    const a = await service.next(COUNTER_KEYS.PATIENT_PID, async () => 42);
    const b = await service.next(COUNTER_KEYS.PATIENT_PID, async () => 42);
    expect(a).toBe(43);
    expect(b).toBe(44);
  });

  it('formats with prefix and pad', async () => {
    const store = new Map<string, { key: string; seq: number }>();
    const service = makeService(store);
    const id = await service.nextFormatted(COUNTER_KEYS.PHARMACY_ORDER, {
      prefix: 'RX',
      pad: 4,
      getInitialMax: async () => 0,
    });
    expect(id).toBe('RX0001');
  });

  it('builds invoice keys per prefix', () => {
    expect(COUNTER_KEYS.invoice('inv')).toBe('invoice:INV');
    expect(COUNTER_KEYS.invoice('LAB')).toBe('invoice:LAB');
  });
});
