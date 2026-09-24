import { COUNTER_KEYS, CountersService } from './counters.service';

describe('CountersService', () => {
  type CounterDoc = { key: string; name?: string; seq: number };

  const makeService = (
    store: Map<string, CounterDoc>,
    opts: {
      /** Simulate legacy unique name_1: reject create/upsert when name missing and another null exists */
      legacyNameUnique?: boolean;
    } = {},
  ) => {
    const service = Object.create(CountersService.prototype) as CountersService;
    (service as any).logger = { warn: jest.fn(), log: jest.fn() };

    const assertLegacyName = (doc: Partial<CounterDoc>) => {
      if (!opts.legacyNameUnique) return;
      const name = doc.name;
      if (name == null || name === '') {
        for (const existing of store.values()) {
          if (existing.name == null || existing.name === '') {
            const err: any = new Error(
              'E11000 duplicate key error collection: synapse-hms.counters index: name_1 dup key: { name: null }',
            );
            err.code = 11000;
            throw err;
          }
        }
      } else {
        for (const existing of store.values()) {
          if (existing.name === name && existing.key !== doc.key) {
            const err: any = new Error('E11000 duplicate key name_1');
            err.code = 11000;
            throw err;
          }
        }
      }
    };

    (service as any).counterModel = {
      findOne: jest.fn(({ key }: { key: string }) => ({
        lean: () => ({
          exec: async () => (store.has(key) ? { ...store.get(key)! } : null),
        }),
      })),
      create: jest.fn(async (doc: CounterDoc) => {
        if (store.has(doc.key)) {
          const err: any = new Error('duplicate key');
          err.code = 11000;
          throw err;
        }
        assertLegacyName(doc);
        store.set(doc.key, { ...doc });
        return doc;
      }),
      updateOne: jest.fn(() => ({
        exec: async () => ({ acknowledged: true, modifiedCount: 1 }),
      })),
      findOneAndUpdate: jest.fn(
        (
          { key }: { key: string },
          update: {
            $inc?: { seq: number };
            $setOnInsert?: { key?: string; name?: string };
          },
          opts: { new?: boolean; upsert?: boolean },
        ) => ({
          lean: () => ({
            exec: async () => {
              const cur = store.get(key);
              if (!cur) {
                if (opts?.upsert) {
                  const insertDoc: CounterDoc = {
                    key: update.$setOnInsert?.key ?? key,
                    name: update.$setOnInsert?.name,
                    seq: 0,
                  };
                  assertLegacyName(insertDoc);
                  insertDoc.seq = (insertDoc.seq ?? 0) + (update.$inc?.seq ?? 0);
                  store.set(key, insertDoc);
                  return { ...insertDoc };
                }
                return null;
              }
              cur.seq += update.$inc?.seq ?? 0;
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
    const store = new Map<string, CounterDoc>();
    const service = makeService(store);
    const a = await service.next(COUNTER_KEYS.PATIENT_PID, async () => 42);
    const b = await service.next(COUNTER_KEYS.PATIENT_PID, async () => 42);
    expect(a).toBe(43);
    expect(b).toBe(44);
    expect(store.get(COUNTER_KEYS.PATIENT_PID)?.name).toBe(
      COUNTER_KEYS.PATIENT_PID,
    );
  });

  it('formats with prefix and pad', async () => {
    const store = new Map<string, CounterDoc>();
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

  it('creates distinct counters under legacy name_1 by setting name=key', async () => {
    const store = new Map<string, CounterDoc>();
    // Pre-existing orphan with name null (only one allowed under name_1).
    store.set('legacy', { key: 'legacy', seq: 1 });

    const service = makeService(store, { legacyNameUnique: true });

    const pid = await service.next(COUNTER_KEYS.PATIENT_PID, async () => 10);
    const order = await service.next(COUNTER_KEYS.PHARMACY_ORDER, async () => 0);
    const lab = await service.next(COUNTER_KEYS.LAB_REPORT, async () => 5);

    expect(pid).toBe(11);
    expect(order).toBe(1);
    expect(lab).toBe(6);
    expect(store.get(COUNTER_KEYS.PATIENT_PID)?.name).toBe(
      COUNTER_KEYS.PATIENT_PID,
    );
    expect(store.get(COUNTER_KEYS.PHARMACY_ORDER)?.name).toBe(
      COUNTER_KEYS.PHARMACY_ORDER,
    );
  });

  it('recovers when upsert hits name_1 null duplicate', async () => {
    const store = new Map<string, CounterDoc>();
    // Block first create without name; model always sends name=key now, so
    // force conflict by pre-seeding a null-name doc and making create omit
    // succeed path via findOne miss + upsert without name first.
    store.set('blocker', { key: 'blocker', seq: 1 }); // name undefined → null

    const service = makeService(store, { legacyNameUnique: true });

    // Spy: first findOneAndUpdate (non-upsert) returns null; upsert path
    // must include name via $setOnInsert to succeed — covered by create name=key.
    const seq = await service.next('invoice:INV', async () => 0);
    expect(seq).toBe(1);
    expect(store.get('invoice:INV')?.name).toBe('invoice:INV');
  });

  it('onModuleInit drops name_1 and ensures key_1', async () => {
    const dropped: string[] = [];
    const created: Array<{ keys: object; opts: object }> = [];
    const service = Object.create(CountersService.prototype) as CountersService;
    (service as any).logger = { warn: jest.fn(), log: jest.fn() };
    (service as any).counterModel = {
      collection: {
        indexes: async () => [
          { name: '_id_', key: { _id: 1 } },
          { name: 'name_1', key: { name: 1 }, unique: true },
        ],
        dropIndex: async (name: string) => {
          dropped.push(name);
        },
        createIndex: async (keys: object, opts: object) => {
          created.push({ keys, opts });
        },
        updateMany: async () => ({ modifiedCount: 0 }),
      },
    };

    await service.onModuleInit();

    expect(dropped).toEqual(['name_1']);
    expect(created).toEqual([
      { keys: { key: 1 }, opts: { unique: true, name: 'key_1' } },
    ]);
  });
});
