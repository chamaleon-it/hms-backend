"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeXml = escapeXml;
exports.tallyDate = tallyDate;
exports.companiesExportXml = companiesExportXml;
exports.createLedgerXml = createLedgerXml;
exports.createCostCentreXml = createCostCentreXml;
exports.createVoucherXml = createVoucherXml;
exports.parseTallyImportResult = parseTallyImportResult;
exports.parseCompanyNames = parseCompanyNames;
function escapeXml(value) {
    if (value === undefined || value === null)
        return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
function tallyDate(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
}
function companiesExportXml(companyName) {
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
function createLedgerXml(ledgerName, parentGroup, companyName) {
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
function createCostCentreXml(name, companyName) {
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
          <COSTCENTRE NAME="${escapeXml(name)}" ACTION="Create">
            <NAME>${escapeXml(name)}</NAME>
            <PARENT></PARENT>
            <CATEGORY>Primary Cost Category</CATEGORY>
          </COSTCENTRE>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}
function createVoucherXml(opts) {
    const companyBlock = opts.companyName
        ? `<SVCURRENTCOMPANY>${escapeXml(opts.companyName)}</SVCURRENTCOMPANY>`
        : '';
    const linesXml = opts.lines
        .map((line) => {
        const abs = Math.abs(line.amount).toFixed(2);
        const amount = line.isDebit ? `-${abs}` : abs;
        const deemed = line.isDebit ? 'Yes' : 'No';
        const centre = String(line.costCentre || '').trim();
        const costCentreXml = centre
            ? `
              <CATEGORYALLOCATIONS.LIST>
                <CATEGORY>Primary Cost Category</CATEGORY>
                <ISDEEMEDPOSITIVE>${deemed}</ISDEEMEDPOSITIVE>
                <COSTCENTREALLOCATIONS.LIST>
                  <NAME>${escapeXml(centre)}</NAME>
                  <ISDEEMEDPOSITIVE>${deemed}</ISDEEMEDPOSITIVE>
                  <AMOUNT>${amount}</AMOUNT>
                </COSTCENTREALLOCATIONS.LIST>
              </CATEGORYALLOCATIONS.LIST>`
            : '';
        return `<ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(line.ledgerName)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>${deemed}</ISDEEMEDPOSITIVE>
              <AMOUNT>${amount}</AMOUNT>${costCentreXml}
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
function parseTallyImportResult(xml) {
    const num = (tag) => {
        const m = xml.match(new RegExp(`<${tag}[^>]*>(\\d+)</${tag}>`, 'i'));
        return m ? parseInt(m[1], 10) : 0;
    };
    const lineError = xml.match(/<LINEERROR[^>]*>([\s\S]*?)<\/LINEERROR>/i)?.[1]?.trim() ||
        xml.match(/<ERRORDESCRIPTION[^>]*>([\s\S]*?)<\/ERRORDESCRIPTION>/i)?.[1]?.trim();
    return {
        created: num('CREATED'),
        altered: num('ALTERED'),
        errors: num('ERRORS'),
        exceptions: num('EXCEPTIONS'),
        lineError,
    };
}
function parseCompanyNames(xml) {
    const names = new Set();
    const patterns = [
        /<COMPANYNAME[^>]*>([^<]+)<\/COMPANYNAME>/gi,
        /<NAME[^>]*>([^<]+)<\/NAME>/gi,
    ];
    for (const re of patterns) {
        let m;
        while ((m = re.exec(xml)) !== null) {
            const n = m[1].trim();
            if (n && n.length < 200 && !n.includes('$$'))
                names.add(n);
        }
    }
    return [...names];
}
//# sourceMappingURL=tally-xml.js.map