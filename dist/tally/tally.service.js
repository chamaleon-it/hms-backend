"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TallyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TallyService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const tally_connection_schema_1 = require("./schemas/tally-connection.schema");
const tally_xml_1 = require("./tally-xml");
const account_transaction_schema_1 = require("../accounts/schemas/account-transaction.schema");
const account_transaction_enum_1 = require("../accounts/enums/account-transaction.enum");
const ledger_group_1 = require("../accounts/ledger-group");
const billing_service_1 = require("../billing/billing.service");
const CONNECTION_KEY = 'pharmacy';
const REQUEST_TIMEOUT_MS = 8000;
let TallyService = TallyService_1 = class TallyService {
    connectionModel;
    accountTransactionModel;
    billingService;
    logger = new common_1.Logger(TallyService_1.name);
    constructor(connectionModel, accountTransactionModel, billingService) {
        this.connectionModel = connectionModel;
        this.accountTransactionModel = accountTransactionModel;
        this.billingService = billingService;
    }
    async getOrCreateConnection() {
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
            pharmacyPaymentLedger: doc.pharmacyPaymentLedger || 'Pharmacy Returns',
            therapyReceiptLedger: doc.therapyReceiptLedger || 'Therapy Income',
            therapyPaymentLedger: doc.therapyPaymentLedger || 'Therapy Refunds',
            receptionReceiptLedger: doc.receptionReceiptLedger || 'Reception Income',
            receptionPaymentLedger: doc.receptionPaymentLedger || 'Reception Refunds',
            purchasePaymentLedger: doc.purchasePaymentLedger || 'Purchase Payments',
            lastCheckedAt: doc.lastCheckedAt || null,
            lastError: doc.lastError || null,
            connectedAt: doc.connectedAt || null,
        };
    }
    baseUrl(host, port) {
        const h = host.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
        return `http://${h}:${port}`;
    }
    async postXml(host, port, xml) {
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
        }
        catch (err) {
            const message = err?.name === 'AbortError'
                ? `Timeout connecting to Tally at ${url} (${REQUEST_TIMEOUT_MS}ms)`
                : err?.message || `Failed to reach Tally at ${url}`;
            return { ok: false, status: 0, body: '', error: message };
        }
        finally {
            clearTimeout(timer);
        }
    }
    async connect(dto, userId) {
        const host = dto.host.trim();
        const port = Number(dto.port);
        if (!host || !port) {
            throw new common_1.BadRequestException('Host and port are required');
        }
        const probe = await this.postXml(host, port, (0, tally_xml_1.companiesExportXml)(dto.companyName));
        const doc = await this.getOrCreateConnection();
        doc.host = host;
        doc.port = port;
        if (dto.companyName !== undefined)
            doc.companyName = dto.companyName.trim();
        if (dto.cashLedger)
            doc.cashLedger = dto.cashLedger.trim();
        if (dto.upiLedger)
            doc.upiLedger = dto.upiLedger.trim();
        if (dto.cardLedger)
            doc.cardLedger = dto.cardLedger.trim();
        if (dto.salesLedger)
            doc.salesLedger = dto.salesLedger.trim();
        if (dto.expenseLedger)
            doc.expenseLedger = dto.expenseLedger.trim();
        if (dto.pharmacyPaymentLedger)
            doc.pharmacyPaymentLedger = dto.pharmacyPaymentLedger.trim();
        if (dto.therapyReceiptLedger)
            doc.therapyReceiptLedger = dto.therapyReceiptLedger.trim();
        if (dto.therapyPaymentLedger)
            doc.therapyPaymentLedger = dto.therapyPaymentLedger.trim();
        if (dto.receptionReceiptLedger)
            doc.receptionReceiptLedger = dto.receptionReceiptLedger.trim();
        if (dto.receptionPaymentLedger)
            doc.receptionPaymentLedger = dto.receptionPaymentLedger.trim();
        if (dto.purchasePaymentLedger)
            doc.purchasePaymentLedger = dto.purchasePaymentLedger.trim();
        doc.lastCheckedAt = new Date();
        if (!probe.ok || probe.error) {
            doc.connected = false;
            doc.lastError =
                probe.error ||
                    `No response from ${host}:${port}. Ensure TallyPrime is running with HTTP/XML server enabled.`;
            await doc.save();
            throw new common_1.ServiceUnavailableException({
                message: doc.lastError,
                data: await this.getStatus(),
            });
        }
        const looksLikeTally = /<ENVELOPE[\s>]/i.test(probe.body) ||
            /<RESPONSE[\s>]/i.test(probe.body) ||
            /TALLY/i.test(probe.body);
        if (!looksLikeTally) {
            doc.connected = false;
            doc.lastError = `Unexpected response from ${host}:${port}. Is this a Tally XML gateway?`;
            await doc.save();
            throw new common_1.ServiceUnavailableException({
                message: doc.lastError,
                data: await this.getStatus(),
            });
        }
        const companies = (0, tally_xml_1.parseCompanyNames)(probe.body);
        if (!doc.companyName && companies.length === 1) {
            doc.companyName = companies[0];
        }
        doc.connected = true;
        doc.lastError = undefined;
        doc.connectedAt = new Date();
        doc.connectedBy = userId ? String(userId) : undefined;
        await doc.save();
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
        const probe = await this.postXml(doc.host, doc.port, (0, tally_xml_1.companiesExportXml)(doc.companyName));
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
        const looksLikeTally = /<ENVELOPE[\s>]/i.test(probe.body) || /TALLY/i.test(probe.body);
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
            companies: (0, tally_xml_1.parseCompanyNames)(probe.body),
            message: `Connected to Tally on ${doc.host}:${doc.port}`,
        };
    }
    async ensureDefaultLedgers(doc) {
        const ledgers = [
            { name: doc.cashLedger || 'Cash', parent: 'Cash-in-Hand' },
            { name: doc.upiLedger || 'UPI', parent: 'Bank Accounts' },
            { name: doc.cardLedger || 'Card', parent: 'Bank Accounts' },
            { name: doc.salesLedger || 'Pharmacy Sales', parent: 'Sales Accounts' },
            {
                name: doc.pharmacyPaymentLedger || 'Pharmacy Returns',
                parent: 'Indirect Expenses',
            },
            {
                name: doc.therapyReceiptLedger || 'Therapy Income',
                parent: 'Sales Accounts',
            },
            {
                name: doc.therapyPaymentLedger || 'Therapy Refunds',
                parent: 'Indirect Expenses',
            },
            {
                name: doc.receptionReceiptLedger || 'Reception Income',
                parent: 'Sales Accounts',
            },
            {
                name: doc.receptionPaymentLedger || 'Reception Refunds',
                parent: 'Indirect Expenses',
            },
            {
                name: doc.purchasePaymentLedger || 'Purchase Payments',
                parent: 'Purchase Accounts',
            },
            {
                name: doc.expenseLedger || 'Indirect Expenses',
                parent: 'Indirect Expenses',
            },
        ];
        for (const { name, parent } of ledgers) {
            try {
                const xml = (0, tally_xml_1.createLedgerXml)(name, parent, doc.companyName);
                await this.postXml(doc.host, doc.port, xml);
            }
            catch (err) {
                this.logger.warn(`Ledger ensure skipped for ${name}: ${err}`);
            }
        }
    }
    paymentLedger(doc, method) {
        switch (method) {
            case account_transaction_enum_1.PaymentMethod.UPI:
            case 'UPI':
                return doc.upiLedger || 'UPI';
            case account_transaction_enum_1.PaymentMethod.Card:
            case 'Card':
                return doc.cardLedger || 'Card';
            case account_transaction_enum_1.PaymentMethod.Cash:
            case 'Cash':
            default:
                return doc.cashLedger || 'Cash';
        }
    }
    ledgerPairFor(doc, group) {
        switch (group) {
            case ledger_group_1.TallyLedgerGroup.Pharmacy:
                return {
                    receiptLedger: doc.salesLedger || 'Pharmacy Sales',
                    paymentLedger: doc.pharmacyPaymentLedger || 'Pharmacy Returns',
                };
            case ledger_group_1.TallyLedgerGroup.Therapy:
                return {
                    receiptLedger: doc.therapyReceiptLedger || 'Therapy Income',
                    paymentLedger: doc.therapyPaymentLedger || 'Therapy Refunds',
                };
            case ledger_group_1.TallyLedgerGroup.Reception:
                return {
                    receiptLedger: doc.receptionReceiptLedger || 'Reception Income',
                    paymentLedger: doc.receptionPaymentLedger || 'Reception Refunds',
                };
            case ledger_group_1.TallyLedgerGroup.Purchase:
                return {
                    receiptLedger: doc.purchasePaymentLedger || 'Purchase Payments',
                    paymentLedger: doc.purchasePaymentLedger || 'Purchase Payments',
                };
            default:
                return {
                    receiptLedger: doc.salesLedger || 'Pharmacy Sales',
                    paymentLedger: doc.expenseLedger || 'Indirect Expenses',
                };
        }
    }
    async syncAccountTransaction(tx) {
        if (!tx || !tx.amount || tx.amount <= 0)
            return { status: 'skipped' };
        if (tx.tallySynced)
            return { status: 'skipped' };
        const doc = await this.connectionModel.findOne({ key: CONNECTION_KEY });
        if (!doc?.connected) {
            return {
                status: 'failed',
                error: 'Tally is not connected',
                unreachable: true,
            };
        }
        const party = this.paymentLedger(doc, tx.paymentMethod);
        const isIncome = tx.type === account_transaction_enum_1.TransactionType.Income || tx.type === 'Income';
        const voucherType = isIncome ? 'Receipt' : 'Payment';
        const ledgerGroup = tx.ledgerGroup ||
            (0, ledger_group_1.ledgerGroupForCategory)(tx.category);
        const { receiptLedger: incomeLedger, paymentLedger: expenseLedger } = this.ledgerPairFor(doc, ledgerGroup);
        const costCentre = ledgerGroup === ledger_group_1.TallyLedgerGroup.Therapy
            ? String(tx.costCentre || '').trim()
            : '';
        const centre = costCentre && costCentre !== '-' ? costCentre : undefined;
        if (centre) {
            await this.postXml(doc.host, doc.port, (0, tally_xml_1.createCostCentreXml)(centre, doc.companyName));
        }
        const lines = isIncome
            ? [
                { ledgerName: party, isDebit: true, amount: tx.amount },
                {
                    ledgerName: incomeLedger,
                    isDebit: false,
                    amount: tx.amount,
                    costCentre: centre,
                },
            ]
            : [
                {
                    ledgerName: expenseLedger,
                    isDebit: true,
                    amount: tx.amount,
                    costCentre: centre,
                },
                { ledgerName: party, isDebit: false, amount: tx.amount },
            ];
        const xml = (0, tally_xml_1.createVoucherXml)({
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
        const parsed = result.body ? (0, tally_xml_1.parseTallyImportResult)(result.body) : null;
        const synced = !!(result.ok &&
            !result.error &&
            parsed &&
            parsed.errors === 0 &&
            !parsed.lineError &&
            (parsed.created > 0 ||
                parsed.altered > 0 ||
                (parsed.created === 0 && parsed.altered === 0 && !/<LINEERROR/i.test(result.body))));
        const errorMsg = !synced
            ? result.error ||
                parsed?.lineError ||
                `Tally rejected ${voucherType} voucher for ${tx.transactionId}`
            : undefined;
        if (!synced) {
            this.logger.warn(`Tally sync failed for ${tx.transactionId}: ${errorMsg}`);
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
    async syncPending() {
        const current = await this.getOrCreateConnection();
        if (!current.connected) {
            throw new common_1.ServiceUnavailableException({
                message: 'Tally is not connected. Use Connect Tally first.',
                data: await this.getStatus(),
            });
        }
        const probe = await this.testConnection();
        if (!probe.ok) {
            throw new common_1.ServiceUnavailableException({
                message: probe.message || 'Tally is not reachable',
                data: await this.getStatus(),
            });
        }
        const doc = await this.getOrCreateConnection();
        await this.ensureDefaultLedgers(doc);
        if (this.billingService) {
            await this.billingService.backfillPaidPharmacyReceipts();
        }
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
        const errors = [];
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
                doc.pharmacyPaymentLedger || 'Pharmacy Returns',
                doc.therapyReceiptLedger || 'Therapy Income',
                doc.therapyPaymentLedger || 'Therapy Refunds',
                doc.receptionReceiptLedger || 'Reception Income',
                doc.receptionPaymentLedger || 'Reception Refunds',
                doc.purchasePaymentLedger || 'Purchase Payments',
                doc.expenseLedger || 'Indirect Expenses',
            ],
        };
        return {
            ...data,
            message: this.syncMessage(data),
        };
    }
    syncMessage(result) {
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
};
exports.TallyService = TallyService;
exports.TallyService = TallyService = TallyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(tally_connection_schema_1.TallyConnection.name)),
    __param(1, (0, mongoose_1.InjectModel)(account_transaction_schema_1.AccountTransaction.name)),
    __param(2, (0, common_1.Optional)()),
    __param(2, (0, common_1.Inject)((0, common_1.forwardRef)(() => billing_service_1.BillingService))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        billing_service_1.BillingService])
], TallyService);
//# sourceMappingURL=tally.service.js.map