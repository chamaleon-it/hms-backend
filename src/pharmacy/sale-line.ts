/**
 * Resolve a pharmacy sale line from the order row and the selected batch.
 * Medicine-level unitPrice is only a last resort — imported stock keeps the
 * selling price, GST, batch number, and expiry on the batch.
 */

const PLACEHOLDER_BATCH =
  /^(b0|b-0|—|–|-|n\/a|na|none|select drug first)$/i;

export function isPlaceholderBatchNumber(value: unknown): boolean {
  const text = String(value ?? '').trim();
  return !text || PLACEHOLDER_BATCH.test(text);
}

export function positiveMoney(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function roundMoney(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/** Dual-read unitPrice and the import alias saleRate. */
export function batchUnitPrice(batch: any): number {
  if (!batch) return 0;
  return positiveMoney(batch.unitPrice ?? batch.saleRate);
}

export function readBatchNumber(batch: any): string {
  if (!batch) return '';
  const candidates = [
    batch.batchNumber,
    batch.batchNo,
    batch.batch,
    batch.lotNumber,
    batch.lot,
  ];
  for (const candidate of candidates) {
    if (!isPlaceholderBatchNumber(candidate)) return String(candidate).trim();
  }
  return '';
}

export function pickGst(...values: unknown[]): number {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

export function pickBatch(
  batches: any[] | undefined,
  wanted?: unknown,
  expiry?: unknown,
): any | undefined {
  const list = Array.isArray(batches) ? batches : [];
  const key = String(wanted ?? '').trim().toLowerCase();
  if (key && !isPlaceholderBatchNumber(key)) {
    const hit = list.find((batch) => {
      const number = readBatchNumber(batch).toLowerCase();
      const raw = String(batch?.batchNumber ?? '')
        .trim()
        .toLowerCase();
      return number === key || raw === key;
    });
    if (hit) return hit;
  }

  if (expiry) {
    const exp = new Date(expiry as any).getTime();
    if (!Number.isNaN(exp)) {
      const byExpiry = list.find((batch) => {
        const stamp = new Date(batch?.expiryDate).getTime();
        return (
          !Number.isNaN(stamp) &&
          Math.abs(stamp - exp) < 36 * 60 * 60 * 1000 &&
          readBatchNumber(batch)
        );
      });
      if (byExpiry) return byExpiry;
    }
  }

  const real = list.filter((batch) => readBatchNumber(batch));
  if (real.length === 1) return real[0];
  if (list.length === 1) return list[0];
  return undefined;
}

export interface ResolvedSaleLine {
  name: string;
  generic?: string;
  batchNumber?: string;
  expiryDate?: Date | string;
  quantity: number;
  unitPrice: number;
  gst: number;
  discount: number;
  /** Taxable line amount (qty × unit price), before GST. */
  total: number;
  gstAmount: number;
  net: number;
}

export function resolveSaleLine(input: {
  name?: any;
  quantity?: unknown;
  unitPrice?: unknown;
  gst?: unknown;
  batchNumber?: unknown;
  expiryDate?: unknown;
  fallbackGst?: unknown;
  item?: any;
}): ResolvedSaleLine {
  const item =
    input.item ?? (input.name && typeof input.name === 'object' ? input.name : undefined);
  const displayName =
    typeof input.name === 'string'
      ? input.name
      : item?.name || input.name?.name || '';
  const batch = pickBatch(
    item?.batches,
    input.batchNumber,
    input.expiryDate || item?.expiryDate,
  );
  const unitPrice =
    positiveMoney(input.unitPrice) ||
    batchUnitPrice(batch) ||
    positiveMoney(item?.unitPrice) ||
    positiveMoney(item?.saleRate) ||
    0;
  const gst = pickGst(input.gst, batch?.gst, item?.gst, input.fallbackGst);
  const quantity = Number(input.quantity) || 0;
  const batchNumber = !isPlaceholderBatchNumber(input.batchNumber)
    ? String(input.batchNumber).trim()
    : readBatchNumber(batch);
  const expiryDate = input.expiryDate || batch?.expiryDate || item?.expiryDate;
  const total = roundMoney(unitPrice * quantity);
  const gstAmount = roundMoney(total * (gst / 100));

  return {
    name: displayName,
    generic: item?.generic || item?.genericName,
    batchNumber: batchNumber || undefined,
    expiryDate,
    quantity,
    unitPrice,
    gst,
    discount: 0,
    total,
    gstAmount,
    net: roundMoney(total + gstAmount),
  };
}
