"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupplierPaymentError = exports.PAYMENT_INVALID_AMOUNT_MESSAGE = exports.PAYMENT_NOT_POSITIVE_MESSAGE = exports.PAYMENT_OVER_DUE_MESSAGE = void 0;
exports.toPaise = toPaise;
exports.duePaise = duePaise;
exports.dueAmount = dueAmount;
exports.compareOpenInvoices = compareOpenInvoices;
exports.planSupplierPayment = planSupplierPayment;
const purchase_entry_schema_1 = require("./schemas/purchase-entry.schema");
exports.PAYMENT_OVER_DUE_MESSAGE = 'Payment total is over the due amount';
exports.PAYMENT_NOT_POSITIVE_MESSAGE = 'Payment total must be greater than 0';
exports.PAYMENT_INVALID_AMOUNT_MESSAGE = 'Cash, card, and UPI must be zero or greater';
class SupplierPaymentError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'SupplierPaymentError';
    }
}
exports.SupplierPaymentError = SupplierPaymentError;
function toPaise(value) {
    return Math.round(value * 100);
}
function duePaise(total, paidAmount) {
    return Math.max(0, toPaise(total) - toPaise(paidAmount || 0));
}
function dueAmount(total, paidAmount) {
    return duePaise(total, paidAmount) / 100;
}
function amountPaise(value) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        throw new SupplierPaymentError('invalid_amount', exports.PAYMENT_INVALID_AMOUNT_MESSAGE);
    }
    return toPaise(value);
}
function invoiceTime(value) {
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
}
function compareOpenInvoices(a, b) {
    const dateDiff = invoiceTime(a.invoiceDate) - invoiceTime(b.invoiceDate);
    if (dateDiff !== 0)
        return dateDiff;
    return String(a.invoiceNumber ?? '').localeCompare(String(b.invoiceNumber ?? ''), undefined, { numeric: true, sensitivity: 'base' });
}
function planSupplierPayment(invoices, amounts) {
    const cashPaise = amountPaise(amounts.cash || 0);
    const cardPaise = amountPaise(amounts.card || 0);
    const upiPaise = amountPaise(amounts.upi || 0);
    const totalPaise = cashPaise + cardPaise + upiPaise;
    const open = [...invoices]
        .filter((invoice) => duePaise(invoice.total, invoice.paidAmount) > 0)
        .sort(compareOpenInvoices);
    const totalDuePaise = open.reduce((sum, invoice) => sum + duePaise(invoice.total, invoice.paidAmount), 0);
    if (totalPaise <= 0) {
        throw new SupplierPaymentError('non_positive', exports.PAYMENT_NOT_POSITIVE_MESSAGE);
    }
    if (totalPaise > totalDuePaise) {
        throw new SupplierPaymentError('over_due', exports.PAYMENT_OVER_DUE_MESSAGE);
    }
    let remainingPaise = totalPaise;
    const allocations = [];
    const updates = [];
    for (const invoice of open) {
        if (remainingPaise <= 0)
            break;
        const openDuePaise = duePaise(invoice.total, invoice.paidAmount);
        const appliedPaise = Math.min(openDuePaise, remainingPaise);
        if (appliedPaise <= 0)
            continue;
        const paidPaise = toPaise(invoice.paidAmount || 0) + appliedPaise;
        const totalInvoicePaise = toPaise(invoice.total);
        const closed = paidPaise >= totalInvoicePaise;
        allocations.push({
            purchaseEntryId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: appliedPaise / 100,
        });
        updates.push({
            id: invoice.id,
            previousPaidAmount: invoice.paidAmount || 0,
            previousPaymentStatus: invoice.paymentStatus,
            paidAmount: closed ? invoice.total : paidPaise / 100,
            paymentStatus: closed ? purchase_entry_schema_1.PaymentStatus.PAID : purchase_entry_schema_1.PaymentStatus.PARTIALLY_PAID,
        });
        remainingPaise -= appliedPaise;
    }
    return {
        cash: cashPaise / 100,
        card: cardPaise / 100,
        upi: upiPaise / 100,
        total: totalPaise / 100,
        totalDue: totalDuePaise / 100,
        allocations,
        updates,
    };
}
//# sourceMappingURL=supplier-payment.allocation.js.map