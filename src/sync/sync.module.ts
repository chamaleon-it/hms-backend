import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { PatientsModule } from '../patients/patients.module';
import { BillingModule } from '../billing/billing.module';
import { OrdersModule } from '../pharmacy/orders/orders.module';
import { ReportModule } from '../lab/report/report.module';
import { ItemsModule } from '../pharmacy/items/items.module';
import { ReturnModule } from '../pharmacy/return/return.module';
import { PurchaseModule } from '../pharmacy/purchase/purchase.module';
import { PharmacyModule } from '../users/pharmacy/pharmacy.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SyncLog, SyncLogSchema } from './schemas/sync-log.schema';

@Module({
    imports: [
        PatientsModule,
        BillingModule,
        OrdersModule,
        ReportModule,
        ItemsModule,
        ReturnModule,
        PurchaseModule,
        PharmacyModule,
        MongooseModule.forFeature([{ name: SyncLog.name, schema: SyncLogSchema }]),
    ],
    controllers: [SyncController],
    providers: [SyncService],
})
export class SyncModule { }
