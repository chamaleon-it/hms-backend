import { Injectable, Logger } from '@nestjs/common';
import { PatientsService } from '../patients/patients.service';
import { BillingService } from '../billing/billing.service';
import { OrdersService } from '../pharmacy/orders/orders.service';
import { ReportService } from '../lab/report/report.service';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SyncLog } from './schemas/sync-log.schema';

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);

    constructor(
        private readonly patientsService: PatientsService,
        private readonly billingService: BillingService,
        private readonly ordersService: OrdersService,
        private readonly reportService: ReportService,
        @InjectModel(SyncLog.name) private syncLogModel: Model<SyncLog>,
    ) { }

    async processActions(actions: any[], userId: string) {
        const results: any[] = [];
        const userObjectId = new mongoose.Types.ObjectId(userId);

        for (const action of actions) {
            try {
                // Check if action already processed
                const existingLog = await this.syncLogModel.findOne({ actionId: action._id });
                if (existingLog) {
                    this.logger.log(`Action ${action._id} already processed, skipping.`);
                    results.push({ id: action._id, status: 'success', data: 'already_processed' });
                    continue;
                }

                // Parse body if it's a string
                if (typeof action.body === 'string') {
                    try {
                        action.body = JSON.parse(action.body);
                    } catch (e) {
                        this.logger.error(`Failed to parse body for action ${action._id}: ${action.body}`);
                    }
                }

                const result = await this.executeAction(action, userObjectId);

                // Log successful processing
                await this.syncLogModel.create({
                    actionId: action._id,
                    userId,
                    status: 'success',
                });

                results.push({ id: action._id, status: 'success', data: result });
            } catch (error) {
                this.logger.error(`Failed to sync action ${action._id} [${action.method} ${action.url}]: ${error.message}`);
                results.push({ id: action._id, status: 'error', message: error.message });
            }
        }
        return results;
    }

    private async executeAction(action: any, userId: mongoose.Types.ObjectId) {
        const { method, url, body } = action;
        const path = url.replace(/^\/api\//, '/').split('?')[0];

        // Patients
        if (path === '/patients' && method === 'POST') {
            return this.patientsService.register(body, userId);
        }
        if (path.startsWith('/patients/') && method === 'PATCH') {
            const id = path.split('/')[2];
            if (!mongoose.isValidObjectId(id)) throw new Error('Invalid patient ID');
            return this.patientsService.updatePatient(body, new mongoose.Types.ObjectId(id));
        }
        if (path.startsWith('/patients/') && method === 'DELETE') {
            const id = path.split('/')[2];
            if (!mongoose.isValidObjectId(id)) throw new Error('Invalid patient ID');
            return this.patientsService.deletePatient(new mongoose.Types.ObjectId(id));
        }

        // Pharmacy Orders
        if (path === '/pharmacy/orders' && method === 'POST') {
            return this.ordersService.createOrder(body);
        }
        if (path === '/pharmacy/orders/update' && method === 'PATCH') {
            return this.ordersService.updateOrder(body);
        }
        if (path.startsWith('/pharmacy/orders/') && method === 'DELETE') {
            const id = path.split('/')[3];
            if (!mongoose.isValidObjectId(id)) throw new Error('Invalid order ID');
            return this.ordersService.deleteOrder(new mongoose.Types.ObjectId(id));
        }

        // Billing
        if (path === '/billing' && method === 'POST') {
            body.user = userId;
            return this.billingService.generateBill(body);
        }

        // Lab Reports
        if (path === '/lab/report' && method === 'POST') {
            return this.reportService.createReport(body);
        }
        if (path === '/lab/report/result' && (method === 'POST' || method === 'PATCH')) {
            return this.reportService.updateResult(body);
        }
        if (path.startsWith('/lab/report/') && method === 'DELETE') {
            const id = path.split('/')[3];
            if (!mongoose.isValidObjectId(id)) throw new Error('Invalid report ID');
            return this.reportService.deleteReport(new mongoose.Types.ObjectId(id));
        }

        throw new Error(`Unsupported action: ${method} ${path}`);
    }
}
