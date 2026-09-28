/** Escape text for Tally XML payloads */
export function escapeXml(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function tallyDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export function companiesExportXml(companyName?: string): string {
  const companyBlock = companyName
    ? `<SVCURRENTCOMPANY>${escapeXml(companyName)}</SVCURRENTCOMPANY>`
    : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export</TALLYREQUEST>
    <TYPE>Data</TYPE>
    <ID>List of Companies</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        ${companyBlock}
      </STATICVARIABLES>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

export function createLedgerXml(
  ledgerName: string,
  parentGroup: string,
  companyName?: string,
): string {
  const companyBlock = companyName
    ? `<SVCURRENTCOMPANY>${escapeXml(companyName)}</SVCURRENTCOMPANY>`
    : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          ${companyBlock}
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="${escapeXml(ledgerName)}" ACTION="Create">
            <NAME>${escapeXml(ledgerName)}</NAME>
            <PARENT>${escapeXml(parentGroup)}</PARENT>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export type VoucherLine = {
  ledgerName: string;
  /** true = Debit (ISDEEMEDPOSITIVE Yes), false = Credit */
  isDebit: boolean;
  amount: number;
};

export function createVoucherXml(opts: {
  voucherType: 'Receipt' | 'Payment';
  date: Date;
  voucherNumber: string;
  narration: string;
  partyLedgerName: string;
  lines: VoucherLine[];
  companyName?: string;
}): string {
  const companyBlock = opts.companyName
    ? `<SVCURRENTCOMPANY>${escapeXml(opts.companyName)}</SVCURRENTCOMPANY>`
    : '';
  const linesXml = opts.lines
    .map((line) => {
      const abs = Math.abs(line.amount).toFixed(2);
      // Tally convention: debit amounts are negative with ISDEEMEDPOSITIVE=Yes
      const amount = line.isDebit ? `-${abs}` : abs;
      return `<ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(line.ledgerName)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>${line.isDebit ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
              <AMOUNT>${amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`;
    })
    .join('\n            ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          ${companyBlock}
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="${escapeXml(opts.voucherType)}" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>${tallyDate(opts.date)}</DATE>
            <NARRATION>${escapeXml(opts.narration)}</NARRATION>
            <VOUCHERTYPENAME>${escapeXml(opts.voucherType)}</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(opts.voucherNumber)}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${escapeXml(opts.partyLedgerName)}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>
            ${linesXml}
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function parseTallyImportResult(xml: string): {
  created: number;
  altered: number;
  errors: number;
  exceptions: number;
  lineError?: string;
} {
  const num = (tag: string) => {
    const m = xml.match(new RegExp(`<${tag}[^>]*>(\\d+)</${tag}>`, 'i'));
    return m ? parseInt(m[1], 10) : 0;
  };
  const lineError =
    xml.match(/<LINEERROR[^>]*>([\s\S]*?)<\/LINEERROR>/i)?.[1]?.trim() ||
    xml.match(/<ERRORDESCRIPTION[^>]*>([\s\S]*?)<\/ERRORDESCRIPTION>/i)?.[1]?.trim();
  return {
    created: num('CREATED'),
    altered: num('ALTERED'),
    errors: num('ERRORS'),
    exceptions: num('EXCEPTIONS'),
    lineError,
  };
}

export function parseCompanyNames(xml: string): string[] {
  const names = new Set<string>();
  const patterns = [
    /<COMPANYNAME[^>]*>([^<]+)<\/COMPANYNAME>/gi,
    /<NAME[^>]*>([^<]+)<\/NAME>/gi,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) {
      const n = m[1].trim();
      if (n && n.length < 200 && !n.includes('$$')) names.add(n);
    }
  }
  return [...names];
}
