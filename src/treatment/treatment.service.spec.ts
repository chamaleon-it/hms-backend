import { Test, TestingModule } from '@nestjs/testing';
import { TreatmentService } from './treatment.service';
import { getModelToken } from '@nestjs/mongoose';
import { Treatment, TreatmentStatus, TreatmentBillingStatus, TreatmentType } from './schemas/treatment.schema';
import { Employee } from '../employee/schemas/employee.schema';
import { BillingService } from '../billing/billing.service';
import mongoose, { Types } from 'mongoose';

describe('TreatmentService', () => {
  let service: TreatmentService;
  let mockTreatmentModel: any;
  let mockEmployeeModel: any;
  let mockBillingService: any;

  const mockTherapistInCharge = {
    _id: new Types.ObjectId(),
    name: 'Sarah Connor',
    role: 'Therapist',
    inCharge: true,
    status: 'Active',
  };

  beforeEach(async () => {
    mockTreatmentModel = jest.fn().mockImplementation((dto) => ({
      ...dto,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue({
        ...dto,
        _id: new Types.ObjectId(),
        toObject: () => ({ ...dto, _id: new Types.ObjectId() }),
      }),
    }));

    mockTreatmentModel.findOne = jest.fn().mockImplementation((query) => {
      return {
        collation: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(null),
              }),
            }),
          }),
        }),
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(null),
                  }),
                  exec: jest.fn().mockResolvedValue(null),
                }),
              }),
            }),
          }),
        }),
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
        exec: jest.fn().mockResolvedValue(null),
      };
    });
    mockTreatmentModel.find = jest.fn();
    mockTreatmentModel.countDocuments = jest.fn().mockResolvedValue(1);
    mockTreatmentModel.findByIdAndUpdate = jest.fn();
    mockTreatmentModel.findOneAndUpdate = jest.fn();
    mockTreatmentModel.exists = jest.fn().mockResolvedValue(false);

    mockEmployeeModel = {
      findOne: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockTherapistInCharge),
        }),
      }),
    };

    mockBillingService = {
      generateBill: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        mrn: 'INV-00100',
        total: 1500,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreatmentService,
        {
          provide: getModelToken(Treatment.name),
          useValue: mockTreatmentModel,
        },
        {
          provide: getModelToken(Employee.name),
          useValue: mockEmployeeModel,
        },
        {
          provide: BillingService,
          useValue: mockBillingService,
        },
      ],
    }).compile();

    service = module.get<TreatmentService>(TreatmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should pick Therapist In-Charge by default', async () => {
    const defaultTherapist = await service.getDefaultTherapist();
    expect(defaultTherapist.therapistName).toBe('Sarah Connor');
    expect(defaultTherapist.therapist).toEqual(mockTherapistInCharge._id);
  });

  it('should create treatment from consultation without generating bill immediately', async () => {
    mockTreatmentModel.findOne.mockReturnValue({
      collation: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(null),
            }),
          }),
        }),
      }),
    });

    const patientId = new Types.ObjectId();
    const result = await service.createFromConsultation({
      type: TreatmentType.Therapy,
      items: [
        {
          name: 'Abhyangam',
          price: 1500,
          quantity: 1,
        },
      ],
      patient: patientId,
      doctorName: 'Dr. John Doe',
    });

    expect(result).toBeDefined();
    expect(mockBillingService.generateBill).not.toHaveBeenCalled();
  });

  it('should process treatment session and create individual bill', async () => {
    const treatmentId = new Types.ObjectId().toString();
    const mockTreatmentDoc = {
      _id: treatmentId,
      patient: new Types.ObjectId(),
      doctorName: 'Dr. John',
      type: 'Therapy',
      sessionNumber: 1,
      items: [{ name: 'Abhyangam', total: 1500, quantity: 1, unitPrice: 1500 }],
      status: TreatmentStatus.Pending,
      billingStatus: TreatmentBillingStatus.Unbilled,
      save: jest.fn().mockResolvedValue({
        _id: treatmentId,
        status: TreatmentStatus.Completed,
        billingStatus: TreatmentBillingStatus.Billed,
        billNo: 'INV-00100',
        toObject: () => ({
          _id: treatmentId,
          status: TreatmentStatus.Completed,
          billingStatus: TreatmentBillingStatus.Billed,
          billNo: 'INV-00100',
        }),
      }),
    };

    mockTreatmentModel.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTreatmentDoc),
      }),
    });

    const processed = await service.processSession(treatmentId, {
      cash: 1500,
      notes: 'First session completed',
      therapistName: 'Sarah Connor',
    });

    expect(mockBillingService.generateBill).toHaveBeenCalled();
    expect(processed.bill.mrn).toBe('INV-00100');
    expect(processed.treatment.status).toBe(TreatmentStatus.Completed);
  });

  it('should repeat a treatment session and retain previous therapist by default', async () => {
    const rootId = new Types.ObjectId();
    const originalDoc = {
      _id: rootId,
      patient: new Types.ObjectId(),
      doctor: new Types.ObjectId(),
      doctorName: 'Dr. John',
      type: 'Therapy',
      sessionNumber: 1,
      therapist: mockTherapistInCharge._id,
      therapistName: mockTherapistInCharge.name,
      items: [{ name: 'Abhyangam', total: 1500, quantity: 1, unitPrice: 1500 }],
    };

    mockTreatmentModel.findOne.mockImplementation((query: any) => {
      if (query?.mrn) {
        return {
          collation: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                lean: jest.fn().mockReturnValue({
                  exec: jest.fn().mockResolvedValue(null),
                }),
              }),
            }),
          }),
        };
      }
      return {
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(originalDoc),
        }),
      };
    });
    mockTreatmentModel.countDocuments.mockResolvedValue(1);

    const repeatResult = await service.repeatSession(rootId.toString(), {
      treatmentDate: new Date(),
    });

    expect(repeatResult).toBeDefined();
    expect(repeatResult.treatment.sessionNumber).toBe(2);
    expect(repeatResult.treatment.therapistName).toBe('Sarah Connor');
    expect(repeatResult.treatment.isRepeated).toBe(true);
  });

  it('should get timeline for all sessions linked to a root treatment', async () => {
    const rootId = new Types.ObjectId();
    const session1 = {
      _id: rootId,
      sessionNumber: 1,
      status: TreatmentStatus.Completed,
      therapistName: 'Sarah Connor',
      items: [{ name: 'Abhyangam', total: 1500 }],
    };
    const session2 = {
      _id: new Types.ObjectId(),
      parentTreatment: rootId,
      sessionNumber: 2,
      status: TreatmentStatus.Pending,
      therapistName: 'Sarah Connor',
      items: [{ name: 'Abhyangam', total: 1500 }],
    };

    mockTreatmentModel.findOne.mockImplementation(() => ({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(session1),
      }),
    }));

    mockTreatmentModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                lean: jest.fn().mockReturnValue({
                  exec: jest.fn().mockResolvedValue([session1, session2]),
                }),
              }),
            }),
          }),
        }),
      }),
    });

    const timeline = await service.getTimeline(rootId.toString());
    expect(timeline.totalSessions).toBe(2);
    expect(timeline.completedSessions).toBe(1);
    expect(timeline.sessions.length).toBe(2);
  });

  it('should prevent double processing if session is already completed/billed', async () => {
    const treatmentId = new Types.ObjectId().toString();
    const mockTreatmentDoc = {
      _id: treatmentId,
      status: TreatmentStatus.Completed,
      billingStatus: TreatmentBillingStatus.Billed,
      billNo: 'INV-00100',
    };

    mockTreatmentModel.findOne.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTreatmentDoc),
      }),
    });

    await expect(
      service.processSession(treatmentId, { cash: 1500 }),
    ).rejects.toThrow('This treatment session has already been processed');
  });

  it('should block deleting a billed treatment session', async () => {
    const treatmentId = new Types.ObjectId().toString();
    const mockBilledDoc = {
      _id: treatmentId,
      status: TreatmentStatus.Completed,
      billingStatus: TreatmentBillingStatus.Billed,
      billNo: 'INV-00100',
      isDeleted: false,
    };

    mockTreatmentModel.findOne.mockResolvedValue(mockBilledDoc);

    await expect(service.delete(treatmentId)).rejects.toThrow(
      'Cannot delete a billed treatment session',
    );
  });

  it('should create root and child sessions when multiple treatmentDates are provided', async () => {
    const mockPatientId = new Types.ObjectId();
    const d1 = new Date('2026-08-20');
    const d2 = new Date('2026-08-21');
    const d3 = new Date('2026-08-22');

    const result = await service.create({
      patient: mockPatientId,
      therapistName: 'Sarah Connor',
      items: [{ name: 'Abhyangam', unitPrice: 1500, quantity: 1, total: 1500 }],
      treatmentDates: [d1, d2, d3],
    });

    expect(result).toBeDefined();
    expect(result.sessionNumber).toBe(1);
    expect(result.isRepeated).toBe(false);
  });
});
