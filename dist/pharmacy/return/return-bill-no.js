"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextReturnBillNumber = nextReturnBillNumber;
const RETURN_BILL_PATTERN = /^R-(\d+)$/;
function nextReturnBillNumber(existing) {
    let highest = 0;
    const used = new Set();
    for (const value of existing) {
        if (!value)
            continue;
        used.add(value);
        const match = RETURN_BILL_PATTERN.exec(value);
        if (match) {
            highest = Math.max(highest, parseInt(match[1], 10));
        }
    }
    let sequence = highest + 1;
    let billNo = formatReturnBillNumber(sequence);
    while (used.has(billNo)) {
        sequence += 1;
        billNo = formatReturnBillNumber(sequence);
    }
    return billNo;
}
function formatReturnBillNumber(sequence) {
    return `R-${sequence.toString().padStart(5, '0')}`;
}
//# sourceMappingURL=return-bill-no.js.map