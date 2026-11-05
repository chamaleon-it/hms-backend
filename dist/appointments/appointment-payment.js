"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAppointmentPayment = resolveAppointmentPayment;
const sale_line_1 = require("../pharmacy/sale-line");
function resolveAppointmentPayment(input, consultationFee) {
    const fee = (0, sale_line_1.roundMoney)((0, sale_line_1.positiveMoney)(consultationFee));
    if (fee <= 0) {
        const split = {
            cash: (0, sale_line_1.roundMoney)((0, sale_line_1.positiveMoney)(input?.cash)),
            card: (0, sale_line_1.roundMoney)((0, sale_line_1.positiveMoney)(input?.card)),
            upi: (0, sale_line_1.roundMoney)((0, sale_line_1.positiveMoney)(input?.upi)),
        };
        return {
            ...split,
            discount: 0,
            paid: (0, sale_line_1.splitTotal)(split),
            payable: 0,
            settled: false,
        };
    }
    const discount = (0, sale_line_1.clampOrderDiscount)(input?.discount, fee);
    const payable = (0, sale_line_1.roundMoney)(fee - discount);
    const split = (0, sale_line_1.clampPaymentSplit)(input, payable);
    const paid = (0, sale_line_1.splitTotal)(split);
    return {
        ...split,
        discount,
        paid,
        payable,
        settled: paid + 0.009 >= payable,
    };
}
//# sourceMappingURL=appointment-payment.js.map