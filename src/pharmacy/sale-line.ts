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

/** Rupee discount, never below zero and never above the subtotal. */
export function clampOrderDiscount(amount: unknown, subtotal: unknown): number {
  const sub = Math.max(0, Number(subtotal) || 0);
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0 || sub <= 0) return 0;
  return roundMoney(Math.min(n, sub));
}

export interface PaymentSplit {
  cash: number;
  card: number;
  upi: number;
}

/**
 * Cash, card, and UPI together never exceed the payable amount.
 * Cash is kept first, then card, then UPI.
 */
export function clampPaymentSplit(
  split: Partial<Record<keyof PaymentSplit, unknown>> | null | undefined,
  payable: unknown,
): PaymentSplit {
  let remaining = Math.max(0, roundMoney(Number(payable) || 0));
  const take = (value: unknown) => {
    const n = positiveMoney(value);
    const used = roundMoney(Math.min(n, remaining));
    remaining = roundMoney(remaining - used);
    return used;
  };
  const cash = take(split?.cash);
  const card = take(split?.card);
  const upi = take(split?.upi);
  return { cash, card, upi };
}

export function splitTotal(split: Partial<PaymentSplit> | null | undefined): number {
  return roundMoney(
    positiveMoney(split?.cash) + positiveMoney(split?.card) + positiveMoney(split?.upi),
  );
}

/** Dual-read unitPrice and the import alias saleRate. */
export function batchUnitPrice(batch: any): number {
  if (!batch) return 0;
  return positiveMoney(batch.unitPrice ?? batch.saleRate);
}

/** Selling price on a batch: unit price, sale rate, or MRP split by pack. */
export function batchSalePrice(batch: any): number {
  if (!batch) return 0;
  const packing = Number(batch.packing);
  const mrp = Number(batch.mrp);
  const perUnit = packing > 0 && mrp > 0 ? mrp / packing : 0;
  return batchUnitPrice(batch) || positiveMoney(perUnit) || positiveMoney(mrp) || 0;
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

/** Stock key, including a batch whose number is the placeholder "B0". */
export function rawBatchNumber(batch: any): string {
  if (!batch) return '';
  const candidates = [
    batch.batchNumber,
    batch.batchNo,
    batch.batch,
    batch.lotNumber,
    batch.lot,
  ];
  for (const candidate of candidates) {
    const text = String(candidate ?? '').trim();
    if (text) return text;
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

/**
 * Batch explicitly chosen on the order line. Does not guess from expiry
 * or from the only remaining non-placeholder batch.
 */
export function chosenBatch(
  batches: any[] | undefined,
  wanted?: unknown,
): any | undefined {
  const list = Array.isArray(batches) ? batches : [];
  const key = String(wanted ?? '')
    .trim()
    .toLowerCase();
  if (!key || isPlaceholderBatchNumber(key)) return undefined;
  return list.find((batch) => {
    const number = readBatchNumber(batch).toLowerCase();
    const raw = String(batch?.batchNumber ?? '')
      .trim()
      .toLowerCase();
    return (number && number === key) || raw === key;
  });
}

function batchQuantity(batch: any): number {
  const quantity = Number(batch?.quantity);
  return Number.isFinite(quantity) ? quantity : 0;
}

/** Calendar day as UTC midnight. Date-only strings stay on that day. */
function calendarDay(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
  }
  const text = String(value).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (match) {
    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}

function isSellableBatch(batch: any, now: Date): boolean {
  if (!rawBatchNumber(batch)) return false;
  if (batch?.isActive === false) return false;
  if (batchQuantity(batch) <= 0) return false;
  const expiry = calendarDay(batch?.expiryDate);
  if (expiry == null) {
    // Doctor orders often point at imported stock whose only batch number is B0
    // and which has no expiry. Other batches still need an unexpired date.
    return isPlaceholderBatchNumber(rawBatchNumber(batch));
  }
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return expiry >= today;
}

function bySoonestExpiry(a: any, b: any): number {
  return (
    (calendarDay(a?.expiryDate) ?? Number.POSITIVE_INFINITY) -
      (calendarDay(b?.expiryDate) ?? Number.POSITIVE_INFINITY) ||
    rawBatchNumber(a).localeCompare(rawBatchNumber(b))
  );
}

export interface DefaultBatchPick {
  batch: any;
  /** True when no sellable batch covers the line quantity. */
  oversell: boolean;
}

/**
 * Batch used when the pharmacist has not chosen one.
 * Prefer an in-stock, unexpired batch that covers the line, soonest expiry first.
 * Otherwise the in-stock, unexpired batch with the most quantity (oversell).
 */
export function defaultSaleBatch(
  batches: any[] | undefined,
  quantityNeeded: number,
  now: Date = new Date(),
): DefaultBatchPick | undefined {
  const sellable = (Array.isArray(batches) ? batches : []).filter((batch) =>
    isSellableBatch(batch, now),
  );
  if (!sellable.length) return undefined;
  const needed = Number(quantityNeeded) || 0;
  const enough = sellable.filter((batch) => batchQuantity(batch) >= needed);
  if (enough.length) {
    enough.sort(bySoonestExpiry);
    return { batch: enough[0], oversell: false };
  }
  sellable.sort(
    (a, b) => batchQuantity(b) - batchQuantity(a) || bySoonestExpiry(a, b),
  );
  return { batch: sellable[0], oversell: needed > batchQuantity(sellable[0]) };
}

/**
 * Batch used to price and sell a queue line.
 * An explicit choice wins. A placeholder such as "B0" is a choice only when
 * stock exists under that number. Otherwise the default in-stock batch is used.
 */
export function lineSaleBatch(
  batches: any[] | undefined,
  wanted?: unknown,
  quantityNeeded?: number,
  now: Date = new Date(),
): any | undefined {
  const explicit = chosenBatch(batches, wanted);
  if (explicit) return explicit;

  const key = String(wanted ?? '').trim().toLowerCase();
  if (key) {
    const listed = (Array.isArray(batches) ? batches : []).find((batch) => {
      if (!isSellableBatch(batch, now)) return false;
      return rawBatchNumber(batch).toLowerCase() === key;
    });
    if (listed) return listed;
  }

  return defaultSaleBatch(batches, Number(quantityNeeded) || 0, now)?.batch;
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
  /** Line amount (qty × unit price). Unit price already includes GST. */
  total: number;
  /** Not added to the line. Unit price is tax-inclusive. */
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
    batchSalePrice(batch) ||
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
    gstAmount: 0,
    net: total,
  };
}
