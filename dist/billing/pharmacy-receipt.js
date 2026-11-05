"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pharmacySaleReceipts = pharmacySaleReceipts;
const MODES = [
    { method: 'Cash', key: 'cash' },
    { method: 'Card', key: 'card' },
    { method: 'UPI', key: 'upi' },
];
function money(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0)
        return 0;
    return Math.round((amount + Number.EPSILON) * 100) / 100;
}
function pharmacySaleReceipts(bill, alreadyExported = 0) {
    if (bill.billingCategory !== 'Pharmacy')
        return [];
    const type = String(bill.transactionType || 'Sale');
    if (type === 'Refund' || type === 'Return')
        return [];
    let remainingCovered = money(alreadyExported);
    const lines = [];
    for (const mode of MODES) {
        const modeAmount = money(bill[mode.key]);
        const exportable = Math.max(0, modeAmount - remainingCovered);
        remainingCovered = Math.max(0, remainingCovered - modeAmount);
        const amount = money(exportable);
        if (amount > 0.001)
            lines.push({ method: mode.method, amount });
    }
    return lines;
}
//# sourceMappingURL=pharmacy-receipt.js.map