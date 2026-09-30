import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TallyConnection,
  TallyConnectionDocument,
} from './schemas/tally-connection.schema';
import { ConnectTallyDto } from './dto/connect-tally.dto';
import {
  companiesExportXml,
  createLedgerXml,
  createVoucherXml,
  parseCompanyNames,
  parseTallyImportResult,
} from './tally-xml';
import {
  AccountTransaction,
  AccountTransactionDocument,
} from 'src/accounts/schemas/account-transaction.schema';
import {
  PaymentMethod,
  TransactionType,
} from 'src/accounts/enums/account-transaction.enum';

const CONNECTION_KEY = 'pharmacy';
const REQUEST_TIMEOUT_MS = 8000;

@Injectable()
export class TallyService {
  private readonly logger = new Logger(TallyService.name);

  constructor(
    @InjectModel(TallyConnection.name)
    private readonly connectionModel: Model<TallyConnectionDocument>,
    @InjectModel(AccountTransaction.name)
    private readonly accountTransactionModel: Model<AccountTransactionDocument>,
  ) {}

  private async getOrCreateConnection(): Promise<TallyConnectionDocument> {
    let doc = await this.connectionModel.findOne({ key: CONNECTION_KEY });
    if (!doc) {
      doc = await this.connectionModel.create({
        key: CONNECTION_KEY,
        host: 'localhost',
        port: 9000,
        connected: false,
        cashLedger: 'Cash',
        upiLedger: 'UPI',
        cardLedger: 'Card',
        salesLedger: 'Pharmacy Sales',
        expenseLedger: 'Indirect Expenses',
      });
    }
    return doc;
  }

  async getStatus() {
    const doc = await this.getOrCreateConnection();
    return {
      connected: !!doc.connected,
      host: doc.host,
      port: doc.port,
      companyName: doc.companyName || '',
      cashLedger: doc.cashLedger || 'Cash',
      upiLedger: doc.upiLedger || 'UPI',
      cardLedger: doc.cardLedger || 'Card',
      salesLedger: doc.salesLedger || 'Pharmacy Sales',
      expenseLedger: doc.expenseLedger || 'Indirect Expenses',
      lastCheckedAt: doc.lastCheckedAt || null,
      lastError: doc.lastError || null,
      connectedAt: doc.connectedAt || null,
    };
  }

  private baseUrl(host: string, port: number) {
    const h = host.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
    return `http://${h}:${port}`;
  }

  async postXml(
    host: string,
    port: number,
    xml: string,
  ): Promise<{ ok: boolean; status: number; body: string; error?: string }> {
    const url = this.baseUrl(host, port);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          Accept: 'application/xml, text/xml, */*',
        },
        body: xml,
        signal: controller.signal,
      });
      const body = await res.text();
      return { ok: res.ok, status: res.status, body };
    } catch (err: any) {
      const message =
        err?.name === 'AbortError'
          ? `Timeout connecting to Tally at ${url} (${REQUEST_TIMEOUT_MS}ms)`
          : err?.message || `Failed to reach Tally at ${url}`;
      return { ok: false, status: 0, body: '', error: message };
    } finally {
      clearTimeout(timer);
    }
  }

  async connect(dto: ConnectTallyDto, userId?: string | { toString(): string }) {
    const host = dto.host.trim();
    const port = Number(dto.port);
    if (!host || !port) {
      throw new BadRequestException('Host and port are required');
    }

    const probe = await this.postXml(host, port, companiesExportXml(dto.companyName));
    const doc = await this.getOrCreateConnection();

    doc.host = host;
    doc.port = port;
    if (dto.companyName !== undefined) doc.companyName = dto.companyName.trim();
    if (dto.cashLedger) doc.cashLedger = dto.cashLedger.trim();
    if (dto.upiLedger) doc.upiLedger = dto.upiLedger.trim();
    if (dto.cardLedger) doc.cardLedger = dto.cardLedger.trim();
    if (dto.salesLedger) doc.salesLedger = dto.salesLedger.trim();
    if (dto.expenseLedger) doc.expenseLedger = dto.expenseLedger.trim();
    doc.lastCheckedAt = new Date();

    if (!probe.ok || probe.error) {
      doc.connected = false;
      doc.lastError =
        probe.error ||
        `No response from ${host}:${port}. Ensure TallyPrime is running with HTTP/XML server enabled.`;
      await doc.save();
      throw new ServiceUnavailableException({
        message: doc.lastError,
        data: await this.getStatus(),
      });
    }

    // Tally often returns 200 even for empty/error XML — require a recognizable envelope
    const looksLikeTally =
      /<ENVELOPE[\s>]/i.test(probe.body) ||
      /<RESPONSE[\s>]/i.test(probe.body) ||
      /TALLY/i.test(probe.body);

    if (!looksLikeTally) {
      doc.connected = false;
      doc.lastError = `Unexpected response from ${host}:${port}. Is this a Tally XML gateway?`;
      await doc.save();
      throw new ServiceUnavailableException({
        message: doc.lastError,
        data: await this.getStatus(),
      });
    }

    const companies = parseCompanyNames(probe.body);
    if (!doc.companyName && companies.length === 1) {
      doc.companyName = companies[0];
    }

    doc.connected = true;
    doc.lastError = undefined;
    doc.connectedAt = new Date();
    doc.connectedBy = userId ? String(userId) : undefined;
    await doc.save();

    // Best-effort: ensure default ledgers exist under the right groups
    await this.ensureDefaultLedgers(doc);

    return {
      ...(await this.getStatus()),
      companies,
    };
  }

  async disconnect() {
    const doc = await this.getOrCreateConnection();
    doc.connected = false;
    doc.lastCheckedAt = new Date();
    doc.lastError = undefined;
    await doc.save();
    return this.getStatus();
  }

  async testConnection() {
    const doc = await this.getOrCreateConnection();
    const probe = await this.postXml(
      doc.host,
      doc.port,
      companiesExportXml(doc.companyName),
    );
    doc.lastCheckedAt = new Date();

    if (!probe.ok || probe.error) {
      doc.connected = false;
      doc.lastError =
        probe.error ||
        `Connection failed: no response from ${doc.host}:${doc.port}`;
      await doc.save();
      return {
        ok: false,
        ...(await this.getStatus()),
        message: doc.lastError,
      };
    }

    const looksLikeTally =
      /<ENVELOPE[\s>]/i.test(probe.body) || /TALLY/i.test(probe.body);
    if (!looksLikeTally) {
      doc.connected = false;
      doc.lastError = 'Unexpected response — not a Tally XML gateway';
      await doc.save();
      return { ok: false, ...(await this.getStatus()), message: doc.lastError };
    }

    doc.connected = true;
    doc.lastError = undefined;
    await doc.save();
    return {
      ok: true,
      ...(await this.getStatus()),
      companies: parseCompanyNames(probe.body),
      message: `Connected to Tally on ${doc.host}:${doc.port}`,
    };
  }

  private async ensureDefaultLedgers(doc: TallyConnectionDocument) {
    const ledgers: Array<{ name: string; parent: string }> = [
      { name: doc.cashLedger || 'Cash', parent: 'Cash-in-Hand' },
      { name: doc.upiLedger || 'UPI', parent: 'Bank Accounts' },
      { name: doc.cardLedger || 'Card', parent: 'Bank Accounts' },
      { name: doc.salesLedger || 'Pharmacy Sales', parent: 'Sales Accounts' },
      {
        name: doc.expenseLedger || 'Indirect Expenses',
        parent: 'Indirect Expenses',
      },
    ];

    for (const { name, parent } of ledgers) {
      try {
        const xml = createLedgerXml(name, parent, doc.companyName);
        await this.postXml(doc.host, doc.port, xml);
      } catch (err) {
        this.logger.warn(`Ledger ensure skipped for ${name}: ${err}`);
      }
    }
  }

  private paymentLedger(
    doc: TallyConnectionDocument,
    method?: PaymentMethod | string,
  ): string {
    switch (method) {
      case PaymentMethod.UPI:
      case 'UPI':
        return doc.upiLedger || 'UPI';
      case PaymentMethod.Card:
      case 'Card':
        return doc.cardLedger || 'Card';
      case PaymentMethod.Cash:
      case 'Cash':
      default:
        return doc.cashLedger || 'Cash';
    }
  }

  /**
   * Push an HMS account transaction into Tally as Receipt (Income) or Payment (Expense).
   * Non-throwing — logs and marks the transaction with sync status.
   */
  async syncAccountTransaction(tx: {
    _id?: any;
    transactionId: string;
    type: TransactionType | string;
    category: string;
    amount: number;
    description: string;
    paymentMethod?: PaymentMethod | string;
    transactionDate?: Date;
    tallySynced?: boolean;
  }): Promise<TallySyncOutcome> {
    if (!tx || !tx.amount || tx.amount <= 0) return { status: 'skipped' };
    if (tx.tallySynced) return { status: 'skipped' };

    const doc = await this.connectionModel.findOne({ key: CONNECTION_KEY });
    if (!doc?.connected) {
      return {
        status: 'failed',
        error: 'Tally is not connected',
        unreachable: true,
      };
    }

    const party = this.paymentLedger(doc, tx.paymentMethod);
    const isIncome = tx.type === TransactionType.Income || tx.type === 'Income';
    const voucherType = isIncome ? 'Receipt' : 'Payment';
    const incomeLedger = doc.salesLedger || 'Pharmacy Sales';
    const expenseLedger = doc.expenseLedger || 'Indirect Expenses';

    // Receipt: Debit Cash/Bank, Credit Sales
    // Payment: Debit Expense, Credit Cash/Bank
    const lines = isIncome
      ? [
          { ledgerName: party, isDebit: true, amount: tx.amount },
          { ledgerName: incomeLedger, isDebit: false, amount: tx.amount },
        ]
      : [
          { ledgerName: expenseLedger, isDebit: true, amount: tx.amount },
          { ledgerName: party, isDebit: false, amount: tx.amount },
        ];

    const xml = createVoucherXml({
      voucherType,
      date: tx.transactionDate ? new Date(tx.transactionDate) : new Date(),
      voucherNumber: tx.transactionId,
      narration: `${tx.description} | ${tx.category}`,
      partyLedgerName: party,
      lines,
      companyName: doc.companyName,
    });

    const result = await this.postXml(doc.host, doc.port, xml);
    const unreachable = !result.ok && !!result.error && result.status === 0;
    const parsed = result.body ? parseTallyImportResult(result.body) : null;

    // Prefer explicit CREATED/ALTERED; treat duplicate/no-op (0/0, no LINEERROR) as synced
    const synced = !!(
      result.ok &&
      !result.error &&
      parsed &&
      parsed.errors === 0 &&
      !parsed.lineError &&
      (parsed.created > 0 ||
        parsed.altered > 0 ||
        (parsed.created === 0 && parsed.altered === 0 && !/<LINEERROR/i.test(result.body)))
    );
    const errorMsg = !synced
      ? result.error ||
        parsed?.lineError ||
        `Tally rejected ${voucherType} voucher for ${tx.transactionId}`
      : undefined;

    if (!synced) {
      this.logger.warn(
        `Tally sync failed for ${tx.transactionId}: ${errorMsg}`,
      );
      doc.lastError = errorMsg;
      await doc.save();
    }

    if (tx._id) {
      await this.accountTransactionModel.findByIdAndUpdate(tx._id, {
        tallySynced: synced,
        tallySyncedAt: synced ? new Date() : undefined,
        tallyVoucherType: voucherType,
        tallyError: errorMsg,
      });
    }

    return synced
      ? { status: 'synced' }
      : { status: 'failed', error: errorMsg, unreachable };
  }

  /**
   * Manual push of hospital account data into Tally.
   * Called only from POST /tally/sync — not on a timer or page load.
   * Reuses the Connect Tally ledgers and the Receipt/Payment voucher import.
   */
  async syncPending() {
    const current = await this.getOrCreateConnection();
    if (!current.connected) {
      throw new ServiceUnavailableException({
        message: 'Tally is not connected. Use Connect Tally first.',
        data: await this.getStatus(),
      });
    }

    const probe = await this.testConnection();
    if (!probe.ok) {
      throw new ServiceUnavailableException({
        message: probe.message || 'Tally is not reachable',
        data: await this.getStatus(),
      });
    }

    const doc = await this.getOrCreateConnection();
    await this.ensureDefaultLedgers(doc);

    const pending = await this.accountTransactionModel
      .find({
        isDeleted: { $ne: true },
        tallySynced: { $ne: true },
        amount: { $gt: 0 },
      })
      .sort({ transactionDate: 1, createdAt: 1 });

    let synced = 0;
    let failed = 0;
    let skipped = 0;
    let stoppedEarly = false;
    const errors: string[] = [];

    for (const tx of pending) {
      const outcome = await this.syncAccountTransaction(tx);
      if (outcome.status === 'synced') {
        synced += 1;
        continue;
      }
      if (outcome.status === 'skipped') {
        skipped += 1;
        continue;
      }
      failed += 1;
      if (outcome.error && errors.length < 8) {
        errors.push(`${tx.transactionId}: ${outcome.error}`);
      }
      if (outcome.unreachable) {
        stoppedEarly = true;
        break;
      }
    }

    const data = {
      synced,
      failed,
      skipped,
      pending: pending.length,
      stoppedEarly,
      errors,
      ledgers: [
        doc.cashLedger || 'Cash',
        doc.upiLedger || 'UPI',
        doc.cardLedger || 'Card',
        doc.salesLedger || 'Pharmacy Sales',
        doc.expenseLedger || 'Indirect Expenses',
      ],
    };

    return {
      ...data,
      message: this.syncMessage(data),
    };
  }

  private syncMessage(result: {
    synced: number;
    failed: number;
    stoppedEarly: boolean;
    errors: string[];
  }): string {
    const { synced, failed, stoppedEarly, errors } = result;
    const detail = errors[0] ? ` ${errors[0]}` : '';
    if (stoppedEarly && synced === 0) {
      return errors[0] || 'Tally is not reachable';
    }
    if (failed === 0 && synced === 0) {
      return 'Tally is up to date. No unsynced transactions to push.';
    }
    if (failed === 0) {
      return `Synced ${synced} transaction${synced === 1 ? '' : 's'} to Tally.`;
    }
    if (synced === 0) {
      return `Tally sync failed for ${failed} transaction${failed === 1 ? '' : 's'}.${detail}`;
    }
    const stopped = stoppedEarly ? ' Sync stopped because Tally became unreachable.' : '';
    return `Synced ${synced} of ${synced + failed} transactions. ${failed} failed.${detail}${stopped}`;
  }
}

type TallySyncOutcome = {
  status: 'synced' | 'skipped' | 'failed';
  error?: string;
  unreachable?: boolean;
};
