import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import configuration from './config/configuration';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PatientsModule } from './patients/patients.module';
import { UploadsModule } from './uploads/uploads.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BillingModule } from './billing/billing.module';
import { ConsultingsModule } from './consultings/consultings.module';
import { ItemsModule } from './pharmacy/items/items.module';
import { OrdersModule } from './pharmacy/orders/orders.module';
import { ReturnModule } from './pharmacy/return/return.module';
import { PurchaseModule } from './pharmacy/purchase/purchase.module';
import { ReportModule } from './lab/report/report.module';
import { PanelsModule } from './lab/panels/panels.module';
import { BackupModule } from './backup/backup.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PharmacistModule } from './pharmacy/pharmacist/pharmacist.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    MongooseModule.forRoot(configuration().databaseUrl),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    UsersModule,
    AuthModule,
    AppointmentsModule,
    PatientsModule,
    UploadsModule,
    BillingModule,
    ConsultingsModule,
    ItemsModule,
    OrdersModule,
    ReturnModule,
    PurchaseModule,
    ReportModule,
    PanelsModule,
    BackupModule,
    SuppliersModule,
    PharmacistModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
