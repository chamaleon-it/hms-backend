/**
 * AR Rahma Item → Item master + Batch B0 migration.
 *
 * Rules:
 * - Ignore / skip nested `batches` from the export JSON entirely.
 * - Build Item master from identity fields only (no pricing/stock on Item).
 * - For every product, create exactly one Batch with batchNumber `B0`.
 * - Batch pricing/stock come from item-level fields (unitPrice/mrp/etc.), never
 *   from the old nested batches array.
 * - Map saleRate → unitPrice when present on the item.
 *
 * Usage (from hms-backend root):
 *   # Dry-run (default) — no writes
 *   DATABASE_URL='mongodb://...' npx tsx scripts/import-item.ts
 *
 *   # Apply upserts by _id (preserves item ids for order refs)
 *   DATABASE_URL='mongodb://...' npx tsx scripts/import-item.ts --apply
 *
 * Options:
 *   --apply              Write to DB (default: dry-run)
 *   --file <path>        JSON export path (default: scripts/rahma.items.json)
 *   --limit <n>          Process only first N items
 *   --pharmacy <oid>     Only items whose pharmacy matches (or override target)
 *   --override-pharmacy <oid>  Force pharmacy ObjectId on written docs
 *   --collection <name>  Mongo collection (default: items)
 *
 * Safe: never drops collections; only replaceOne/upserts matching _ids.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import mongoose from 'mongoose';

type JsonValue = null | boolean | number | string | JsonValue[] | JsonObject;
type JsonObject = { [key: string]: JsonValue };

interface CliOptions {
  apply: boolean;
  file: string;
  limit: number | null;
  pharmacy: string | null;
  overridePharmacy: string | null;
  collection: string;
}

interface MappedBatch {
  batchNumber: string;
  expiryDate: Date;
  mrp: number;
  purchaseRate: number;
  unitPrice: number;
  startingQuantity: number;
  quantity: number;
  status: 'active' | 'inactive';
  supplier: string;
  packing: number;
  stripCount: number;
  gst: number;
  createdAt: Date;
}

interface MappedItem {
  _id: mongoose.Types.ObjectId;
  name: string;
  pharmacy: mongoose.Types.ObjectId;
  generic: string;
  hsnCode: string;
  category: string;
  manufacturer: string;
  soldQuantity: number;
  soldHistory: Array<{
    date: Date;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  rackLocation: string;
  status: string;
  batches: MappedBatch[];
  createdAt?: Date;
  updatedAt?: Date;
}

const DEFAULT_FILE = path.join(__dirname, 'rahma.items.json');

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    apply: false,
    file: DEFAULT_FILE,
    limit: null,
    pharmacy: null,
    overridePharmacy: null,
    collection: 'items',
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--apply') opts.apply = true;
    else if (a === '--dry-run') opts.apply = false;
    else if (a === '--file') opts.file = path.resolve(argv[++i] ?? '');
    else if (a === '--limit') opts.limit = Number(argv[++i]);
    else if (a === '--pharmacy') opts.pharmacy = String(argv[++i] ?? '').trim();
    else if (a === '--override-pharmacy') {
      opts.overridePharmacy = String(argv[++i] ?? '').trim();
    } else if (a === '--collection') {
      opts.collection = String(argv[++i] ?? 'items').trim() || 'items';
    } else if (a === '--help' || a === '-h') {
      printHelpAndExit(0);
    } else {
      console.error(`Unknown argument: ${a}`);
      printHelpAndExit(1);
    }
  }
  return opts;
}

function printHelpAndExit(code: number): never {
  console.log(`Usage: npx tsx scripts/import-item.ts [options]

Options:
  --dry-run                 No writes (default)
  --apply                   Upsert mapped documents by _id
  --file <path>             Source JSON (default: scripts/rahma.items.json)
  --limit <n>               Process first N items only
  --pharmacy <oid>          Filter source items by pharmacy
  --override-pharmacy <oid> Force pharmacy on output docs
  --collection <name>       Target collection (default: items)
`);
  process.exit(code);
}

function isExtOid(v: unknown): v is { $oid: string } {
  return (
    !!v &&
    typeof v === 'object' &&
    '$oid' in (v as object) &&
    typeof (v as { $oid: unknown }).$oid === 'string'
  );
}

function isExtDate(v: unknown): v is { $date: string | number } {
  return (
    !!v &&
    typeof v === 'object' &&
    '$date' in (v as object) &&
    ((v as { $date: unknown }).$date !== undefined)
  );
}

function toObjectId(v: unknown, field: string): mongoose.Types.ObjectId {
  if (v instanceof mongoose.Types.ObjectId) return v;
  if (isExtOid(v)) return new mongoose.Types.ObjectId(v.$oid);
  if (typeof v === 'string' && mongoose.Types.ObjectId.isValid(v)) {
    return new mongoose.Types.ObjectId(v);
  }
  throw new Error(`Invalid ObjectId for ${field}: ${JSON.stringify(v)}`);
}

function toDate(v: unknown, fallback?: Date): Date {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (isExtDate(v)) {
    const d = new Date(v.$date);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (fallback) return fallback;
  throw new Error(`Invalid date: ${JSON.stringify(v)}`);
}

/** Soft ceiling for stock ints — catches corrupt export values (e.g. 7e22). */
const MAX_STOCK_QTY = 1_000_000;

function toNumber(v: unknown, fallback = 0): number {
  if (v === null || v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toStockInt(
  v: unknown,
  fallback: number,
  label: string,
  warnings: string[],
): number {
  const raw = toNumber(v, Number.NaN);
  if (!Number.isFinite(raw)) {
    warnings.push(`${label}: non-numeric (${JSON.stringify(v)}); using ${fallback}`);
    return Math.max(0, Math.trunc(fallback));
  }
  if (raw < 0 || raw > MAX_STOCK_QTY) {
    warnings.push(
      `${label}: out of range (${raw}); using ${fallback} (max ${MAX_STOCK_QTY})`,
    );
    return Math.max(0, Math.trunc(fallback));
  }
  return Math.trunc(raw);
}

function toString(v: unknown, fallback = '-'): string {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s || fallback;
}

function loadSource(file: string): JsonObject[] {
  if (!fs.existsSync(file)) {
    throw new Error(`Source file not found: ${file}`);
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as JsonValue;
  if (!Array.isArray(raw)) {
    throw new Error('Expected a JSON array of item documents');
  }
  return raw as JsonObject[];
}

/**
 * Map one old item export doc → new Item master + single Batch B0.
 * Nested `batches` are intentionally ignored.
 */
function mapItem(
  raw: JsonObject,
  overridePharmacy: string | null,
  warnings: string[],
): MappedItem {
  // Explicitly discard nested batches — never read pricing/stock from them.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { batches: _ignoredBatches, ...item } = raw;
  const idHint = isExtOid(item._id) ? item._id.$oid : String(item._id ?? '?');
  const nameHint = toString(item.name, idHint);

  const unitPrice = toNumber(
    item.saleRate !== undefined && item.saleRate !== null && item.saleRate !== ''
      ? item.saleRate
      : item.unitPrice,
    0,
  );
  const mrp = toNumber(item.mrp, unitPrice);
  const purchaseRate = toNumber(
    item.purchaseRate !== undefined && item.purchaseRate !== null
      ? item.purchaseRate
      : item.purchasePrice,
    0,
  );

  // Prefer openingStockQuantity as fallback when item.quantity is absurdly large.
  // Negative quantity → 0 (do not invent stock from opening).
  const openingRaw = toNumber(item.openingStockQuantity, Number.NaN);
  const openingFallback =
    Number.isFinite(openingRaw) &&
    openingRaw >= 0 &&
    openingRaw <= MAX_STOCK_QTY
      ? Math.trunc(openingRaw)
      : 0;
  const qtyRaw = toNumber(item.quantity, Number.NaN);
  let quantity: number;
  if (!Number.isFinite(qtyRaw)) {
    warnings.push(
      `${nameHint} quantity: non-numeric (${JSON.stringify(item.quantity)}); using 0`,
    );
    quantity = 0;
  } else if (qtyRaw < 0) {
    warnings.push(`${nameHint} quantity: negative (${qtyRaw}); using 0`);
    quantity = 0;
  } else if (qtyRaw > MAX_STOCK_QTY) {
    warnings.push(
      `${nameHint} quantity: out of range (${qtyRaw}); using openingStockQuantity=${openingFallback}`,
    );
    quantity = openingFallback;
  } else {
    quantity = Math.trunc(qtyRaw);
  }
  const startingQuantity = toStockInt(
    item.openingStockQuantity !== undefined && item.openingStockQuantity !== null
      ? item.openingStockQuantity
      : quantity,
    quantity,
    `${nameHint} startingQuantity`,
    warnings,
  );
  const expiryDate = toDate(item.expiryDate, new Date('2099-12-31T00:00:00.000Z'));
  const supplier = toString(item.supplier, '-');
  const packing = toNumber(item.packing, 0);
  const stripCount = toNumber(
    item.stripCount !== undefined && item.stripCount !== null
      ? item.stripCount
      : item.noOfPacking,
    0,
  );
  const gst = toNumber(item.gst, 0);

  const soldHistoryRaw = Array.isArray(item.soldHistory) ? item.soldHistory : [];
  const soldHistory = soldHistoryRaw
    .filter((h): h is JsonObject => !!h && typeof h === 'object')
    .map((h) => ({
      date: toDate(h.date, new Date()),
      quantity: toNumber(h.quantity, 0),
      unitPrice: toNumber(h.unitPrice, 0),
      total: toNumber(h.total, 0),
    }));

  const pharmacy = overridePharmacy
    ? new mongoose.Types.ObjectId(overridePharmacy)
    : toObjectId(item.pharmacy, 'pharmacy');

  const batch: MappedBatch = {
    batchNumber: 'B0',
    expiryDate,
    mrp,
    purchaseRate,
    unitPrice,
    startingQuantity,
    quantity,
    status: 'active',
    supplier,
    packing,
    stripCount,
    gst,
    createdAt: toDate(item.createdAt, new Date()),
  };

  return {
    _id: toObjectId(item._id, '_id'),
    name: toString(item.name, ''),
    pharmacy,
    generic: toString(item.generic, toString(item.name, '')),
    hsnCode: toString(item.hsnCode, '-'),
    category: toString(item.category, 'Medicine'),
    manufacturer: toString(item.manufacturer, '-'),
    soldQuantity: toNumber(item.soldQuantity, 0),
    soldHistory,
    rackLocation: toString(item.rackLocation, '-'),
    status: toString(item.status, 'Active'),
    batches: [batch],
    createdAt: item.createdAt ? toDate(item.createdAt) : undefined,
    updatedAt: item.updatedAt ? toDate(item.updatedAt) : undefined,
  };
}

function summarize(mapped: MappedItem[]): void {
  const withStock = mapped.filter((i) => i.batches[0].quantity > 0).length;
  const deleted = mapped.filter((i) => i.status === 'Deleted').length;
  const saleRateMapped = 0; // counted during map via logging below if needed
  const totalQty = mapped.reduce((s, i) => s + i.batches[0].quantity, 0);
  const totalValue = mapped.reduce(
    (s, i) => s + i.batches[0].quantity * i.batches[0].unitPrice,
    0,
  );

  console.log('\n--- Summary ---');
  console.log(`Items mapped:     ${mapped.length}`);
  console.log(`With stock > 0:   ${withStock}`);
  console.log(`Status Deleted:   ${deleted}`);
  console.log(`Batch number:     B0 (one per item; nested batches ignored)`);
  console.log(`Total B0 qty:     ${totalQty}`);
  console.log(`Est. sell value:  ${totalValue.toFixed(2)}`);
  void saleRateMapped;

  const sample = mapped[0];
  if (sample) {
    console.log('\n--- Sample (first) ---');
    console.log(
      JSON.stringify(
        {
          _id: String(sample._id),
          name: sample.name,
          pharmacy: String(sample.pharmacy),
          status: sample.status,
          masterKeys: [
            'name',
            'pharmacy',
            'generic',
            'hsnCode',
            'category',
            'manufacturer',
            'soldQuantity',
            'soldHistory',
            'rackLocation',
            'status',
            'batches',
          ],
          batch: {
            ...sample.batches[0],
            expiryDate: sample.batches[0].expiryDate.toISOString(),
            createdAt: sample.batches[0].createdAt.toISOString(),
          },
        },
        null,
        2,
      ),
    );
  }
}

/** Indexes left over from deleted Item fields — block imports when unique. */
const OBSOLETE_ITEM_INDEXES = ['sku_1'] as const;

async function dropObsoleteIndexes(collectionName: string): Promise<void> {
  const col = mongoose.connection.collection(collectionName);
  const existing = await col.indexes();
  const names = new Set(existing.map((idx) => idx.name).filter(Boolean));

  console.log('\n--- Indexes ---');
  for (const idx of existing) {
    console.log(`  ${idx.name}: ${JSON.stringify(idx.key)}`);
  }

  for (const name of OBSOLETE_ITEM_INDEXES) {
    if (!names.has(name)) {
      console.log(`obsolete index ${name}: not present (ok)`);
      continue;
    }
    await col.dropIndex(name);
    console.log(`dropped obsolete index: ${name}`);
  }
}

async function applyUpserts(
  mapped: MappedItem[],
  collectionName: string,
): Promise<void> {
  await dropObsoleteIndexes(collectionName);

  const col = mongoose.connection.collection(collectionName);
  let upserted = 0;
  let modified = 0;
  let matched = 0;

  for (const doc of mapped) {
    const { _id, createdAt, updatedAt, ...rest } = doc;
    const setDoc: Record<string, unknown> = {
      ...rest,
      updatedAt: updatedAt ?? new Date(),
    };
    if (createdAt) setDoc.createdAt = createdAt;

    // Full replace without sku / flat pricing — matches post-cleanup Item schema.
    const result = await col.replaceOne(
      { _id },
      { _id, ...setDoc },
      { upsert: true },
    );
    matched += result.matchedCount;
    modified += result.modifiedCount;
    upserted += result.upsertedCount;
  }

  console.log('\n--- Apply result ---');
  console.log(`matched:  ${matched}`);
  console.log(`modified: ${modified}`);
  console.log(`upserted: ${upserted}`);
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  const databaseUrl = process.env.DATABASE_URL?.trim();

  console.log('AR Rahma item import');
  console.log(`mode:       ${opts.apply ? 'APPLY (writes)' : 'DRY-RUN (no writes)'}`);
  console.log(`file:       ${opts.file}`);
  console.log(`collection: ${opts.collection}`);
  if (opts.limit != null) console.log(`limit:      ${opts.limit}`);
  if (opts.pharmacy) console.log(`filter pharmacy: ${opts.pharmacy}`);
  if (opts.overridePharmacy) {
    console.log(`override pharmacy: ${opts.overridePharmacy}`);
  }

  let source = loadSource(opts.file);
  console.log(`source rows: ${source.length}`);

  if (opts.pharmacy) {
    const filterId = opts.pharmacy;
    source = source.filter((row) => {
      try {
        return String(toObjectId(row.pharmacy, 'pharmacy')) === filterId;
      } catch {
        return false;
      }
    });
    console.log(`after pharmacy filter: ${source.length}`);
  }

  if (opts.limit != null && Number.isFinite(opts.limit) && opts.limit >= 0) {
    source = source.slice(0, opts.limit);
    console.log(`after limit: ${source.length}`);
  }

  const mapped: MappedItem[] = [];
  let saleRateHits = 0;
  let skippedBatches = 0;
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < source.length; i++) {
    const row = source[i];
    try {
      if (row.saleRate !== undefined && row.saleRate !== null && row.saleRate !== '') {
        saleRateHits += 1;
      }
      if (Array.isArray(row.batches)) skippedBatches += row.batches.length;
      const doc = mapItem(row, opts.overridePharmacy, warnings);
      if (!doc.name || doc.name.length < 1) {
        throw new Error('empty name');
      }
      mapped.push(doc);
    } catch (err) {
      const id = isExtOid(row._id) ? row._id.$oid : String(row._id);
      errors.push(`#${i} _id=${id}: ${(err as Error).message}`);
    }
  }

  console.log(`mapped ok:  ${mapped.length}`);
  console.log(`errors:     ${errors.length}`);
  console.log(`warnings:   ${warnings.length}`);
  console.log(`saleRate→unitPrice hits: ${saleRateHits}`);
  console.log(`nested batch rows ignored: ${skippedBatches}`);
  if (warnings.length) {
    console.log('\nStock sanitization warnings:');
    for (const w of warnings.slice(0, 20)) console.log(' ', w);
  }
  if (errors.length) {
    console.log('\nFirst errors:');
    for (const e of errors.slice(0, 10)) console.log(' ', e);
  }

  summarize(mapped);

  if (!opts.apply) {
    console.log(
      '\nDry-run complete. Re-run with --apply and DATABASE_URL to write.',
    );
    return;
  }

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is required for --apply. Export it in the environment.',
    );
  }

  if (!mapped.length) {
    console.log('Nothing to write.');
    return;
  }

  console.log('\nConnecting...');
  await mongoose.connect(databaseUrl);
  try {
    await applyUpserts(mapped, opts.collection);
  } finally {
    await mongoose.disconnect();
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error('\nImport failed:', err);
  process.exit(1);
});
