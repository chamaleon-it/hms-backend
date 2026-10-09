const RETURN_BILL_PATTERN = /^R-(\d+)$/;

/** Next return bill number that is not already used. */
export function nextReturnBillNumber(existing: string[]): string {
  let highest = 0;
  const used = new Set<string>();
  for (const value of existing) {
    if (!value) continue;
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

function formatReturnBillNumber(sequence: number): string {
  return `R-${sequence.toString().padStart(5, '0')}`;
}
