import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../users/schemas/user.schema';
import { Appointment } from '../appointments/schemas/appointment.schema';
import { Patient } from '../patients/schemas/patient.schema';
import { Billing } from '../billing/schemas/billing.schema';
import { BillingItem } from '../billing/schemas/billingItem.schema';
import { Consulting } from '../consultings/schemas/consulting.schema';
import { InPatient } from '../in-patients/schemas/in-patient.schema';
import { Report } from '../lab/report/schemas/report.schema';
import { Therapy } from '../therapy/schemas/therapy.schema';

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const mockModel = { find: jest.fn(), countDocuments: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getModelToken(User.name), useValue: mockModel },
        { provide: getModelToken(Appointment.name), useValue: mockModel },
        { provide: getModelToken(Patient.name), useValue: mockModel },
        { provide: getModelToken(Billing.name), useValue: mockModel },
        { provide: getModelToken(BillingItem.name), useValue: mockModel },
        { provide: getModelToken(Consulting.name), useValue: mockModel },
        { provide: getModelToken(InPatient.name), useValue: mockModel },
        { provide: getModelToken(Report.name), useValue: mockModel },
        { provide: getModelToken(Therapy.name), useValue: mockModel },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
