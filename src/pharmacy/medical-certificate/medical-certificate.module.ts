import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';
import { MedicalCertificateController } from './medical-certificate.controller';
import { MedicalCertificateService } from './medical-certificate.service';
import {
  MedicalCertificate,
  MedicalCertificateSchema,
} from './schemas/medical-certificate.schema';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: MedicalCertificate.name, schema: MedicalCertificateSchema },
    ]),
  ],
  controllers: [MedicalCertificateController],
  providers: [MedicalCertificateService],
})
export class MedicalCertificateModule {}
