"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlaceholderBatchNumber = isPlaceholderBatchNumber;
exports.positiveMoney = positiveMoney;
exports.roundMoney = roundMoney;
exports.clampOrderDiscount = clampOrderDiscount;
exports.clampPaymentSplit = clampPaymentSplit;
exports.splitTotal = splitTotal;
exports.batchUnitPrice = batchUnitPrice;
exports.batchSalePrice = batchSalePrice;
exports.readBatchNumber = readBatchNumber;
exports.rawBatchNumber = rawBatchNumber;
exports.pickGst = pickGst;
exports.pickBatch = pickBatch;
exports.chosenBatch = chosenBatch;
exports.defaultSaleBatch = defaultSaleBatch;
exports.lineSaleBatch = lineSaleBatch;
exports.resolveSaleLine = resolveSaleLine;
const PLACEHOLDER_BATCH = /^(b0|b-0|—|–|-|n\/a|na|none|select drug first)$/i;
function isPlaceholderBatchNumber(value) {
    const text = String(value ?? '').trim();
    return !text || PLACEHOLDER_BATCH.test(text);
}
function positiveMoney(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
}
function roundMoney(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
}
function clampOrderDiscount(amount, subtotal) {
    const sub = Math.max(0, Number(subtotal) || 0);
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0 || sub <= 0)
        return 0;
    return roundMoney(Math.min(n, sub));
}
function clampPaymentSplit(split, payable) {
    let remaining = Math.max(0, roundMoney(Number(payable) || 0));
    const take = (value) => {
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
function splitTotal(split) {
    return roundMoney(positiveMoney(split?.cash) + positiveMoney(split?.card) + positiveMoney(split?.upi));
}
function batchUnitPrice(batch) {
    if (!batch)
        return 0;
    return positiveMoney(batch.unitPrice ?? batch.saleRate);
}
function batchSalePrice(batch) {
    if (!batch)
        return 0;
    const packing = Number(batch.packing);
    const mrp = Number(batch.mrp);
    const perUnit = packing > 0 && mrp > 0 ? mrp / packing : 0;
    return batchUnitPrice(batch) || positiveMoney(perUnit) || positiveMoney(mrp) || 0;
}
function readBatchNumber(batch) {
    if (!batch)
        return '';
    const candidates = [
        batch.batchNumber,
        batch.batchNo,
        batch.batch,
        batch.lotNumber,
        batch.lot,
    ];
    for (const candidate of candidates) {
        if (!isPlaceholderBatchNumber(candidate))
            return String(candidate).trim();
    }
    return '';
}
function rawBatchNumber(batch) {
    if (!batch)
        return '';
    const candidates = [
        batch.batchNumber,
        batch.batchNo,
        batch.batch,
        batch.lotNumber,
        batch.lot,
    ];
    for (const candidate of candidates) {
        const text = String(candidate ?? '').trim();
        if (text)
            return text;
    }
    return '';
}
function pickGst(...values) {
    for (const value of values) {
        const n = Number(value);
        if (Number.isFinite(n) && n > 0)
            return n;
    }
    return 0;
}
function pickBatch(batches, wanted, expiry) {
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
        if (hit)
            return hit;
    }
    if (expiry) {
        const exp = new Date(expiry).getTime();
        if (!Number.isNaN(exp)) {
            const byExpiry = list.find((batch) => {
                const stamp = new Date(batch?.expiryDate).getTime();
                return (!Number.isNaN(stamp) &&
                    Math.abs(stamp - exp) < 36 * 60 * 60 * 1000 &&
                    readBatchNumber(batch));
            });
            if (byExpiry)
                return byExpiry;
        }
    }
    const real = list.filter((batch) => readBatchNumber(batch));
    if (real.length === 1)
        return real[0];
    if (list.length === 1)
        return list[0];
    return undefined;
}
function chosenBatch(batches, wanted) {
    const list = Array.isArray(batches) ? batches : [];
    const key = String(wanted ?? '')
        .trim()
        .toLowerCase();
    if (!key || isPlaceholderBatchNumber(key))
        return undefined;
    return list.find((batch) => {
        const number = readBatchNumber(batch).toLowerCase();
        const raw = String(batch?.batchNumber ?? '')
            .trim()
            .toLowerCase();
        return (number && number === key) || raw === key;
    });
}
function batchQuantity(batch) {
    const quantity = Number(batch?.quantity);
    return Number.isFinite(quantity) ? quantity : 0;
}
function calendarDay(value) {
    if (value == null || value === '')
        return null;
    if (value instanceof Date) {
        if (Number.isNaN(value.getTime()))
            return null;
        return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
    }
    const text = String(value).trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
    if (match) {
        return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime()))
        return null;
    return Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
}
function isSellableBatch(batch, now) {
    if (!rawBatchNumber(batch))
        return false;
    if (batch?.isActive === false)
        return false;
    if (batchQuantity(batch) <= 0)
        return false;
    const expiry = calendarDay(batch?.expiryDate);
    if (expiry == null) {
        return isPlaceholderBatchNumber(rawBatchNumber(batch));
    }
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return expiry >= today;
}
function bySoonestExpiry(a, b) {
    return ((calendarDay(a?.expiryDate) ?? Number.POSITIVE_INFINITY) -
        (calendarDay(b?.expiryDate) ?? Number.POSITIVE_INFINITY) ||
        rawBatchNumber(a).localeCompare(rawBatchNumber(b)));
}
function defaultSaleBatch(batches, quantityNeeded, now = new Date()) {
    const sellable = (Array.isArray(batches) ? batches : []).filter((batch) => isSellableBatch(batch, now));
    if (!sellable.length)
        return undefined;
    const needed = Number(quantityNeeded) || 0;
    const enough = sellable.filter((batch) => batchQuantity(batch) >= needed);
    if (enough.length) {
        enough.sort(bySoonestExpiry);
        return { batch: enough[0], oversell: false };
    }
    sellable.sort((a, b) => batchQuantity(b) - batchQuantity(a) || bySoonestExpiry(a, b));
    return { batch: sellable[0], oversell: needed > batchQuantity(sellable[0]) };
}
function lineSaleBatch(batches, wanted, quantityNeeded, now = new Date()) {
    const explicit = chosenBatch(batches, wanted);
    if (explicit)
        return explicit;
    const key = String(wanted ?? '').trim().toLowerCase();
    if (key) {
        const listed = (Array.isArray(batches) ? batches : []).find((batch) => {
            if (!isSellableBatch(batch, now))
                return false;
            return rawBatchNumber(batch).toLowerCase() === key;
        });
        if (listed)
            return listed;
    }
    return defaultSaleBatch(batches, Number(quantityNeeded) || 0, now)?.batch;
}
function resolveSaleLine(input) {
    const item = input.item ?? (input.name && typeof input.name === 'object' ? input.name : undefined);
    const displayName = typeof input.name === 'string'
        ? input.name
        : item?.name || input.name?.name || '';
    const batch = pickBatch(item?.batches, input.batchNumber, input.expiryDate || item?.expiryDate);
    const unitPrice = positiveMoney(input.unitPrice) ||
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
//# sourceMappingURL=sale-line.js.map