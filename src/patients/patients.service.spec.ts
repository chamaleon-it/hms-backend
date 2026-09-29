import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { PatientsService } from './patients.service';
import { GetPatientsDto } from './dto/get-patients.dto';
import { Patient, PatientStatus } from './schemas/patient.schema';
import { Appointment } from '../appointments/schemas/appointment.schema';

function yearsAgo(years: number): string {
  const now = new Date();
  return new Date(
    now.getFullYear() - years,
    now.getMonth(),
    now.getDate(),
  ).toISOString();
}

function fieldMatches(patient: any, clause: Record<string, any>): boolean {
  const field = Object.keys(clause)[0];
  const cond = clause[field];
  if (cond && typeof cond === 'object' && '$regex' in cond) {
    return new RegExp(cond.$regex, cond.$options || '').test(
      String(patient[field] ?? ''),
    );
  }
  return String(patient[field] ?? '') === String(cond ?? '');
}

/** Applies the filter document the service hands to Mongo, so a stripped query returns every row. */
function applyFilter(rows: any[], filter: any) {
  return rows.filter((patient) => {
    if (
      filter.status?.$ne !== undefined &&
      patient.status === filter.status.$ne
    ) {
      return false;
    }
    if (typeof filter.status === 'string' && patient.status !== filter.status) {
      return false;
    }
    if (filter.gender && patient.gender !== filter.gender) return false;
    if (filter.doctor && String(patient.doctor) !== String(filter.doctor)) {
      return false;
    }
    if (filter._id?.$in) {
      const ids = filter._id.$in.map((id: any) => String(id));
      if (!ids.includes(String(patient._id))) return false;
    }
    if (filter.conditions?.$in) {
      const wanted: string[] = filter.conditions.$in;
      const have: string[] = patient.conditions || [];
      if (!wanted.some((condition) => have.includes(condition))) return false;
    }
    if (filter.createdAt) {
      const created = new Date(patient.createdAt);
      if (filter.createdAt.$gte && created < new Date(filter.createdAt.$gte)) {
        return false;
      }
      if (filter.createdAt.$lt && created >= new Date(filter.createdAt.$lt)) {
        return false;
      }
    }
    for (const field of ['city', 'district', 'state', 'pinCode'] as const) {
      const cond = filter[field];
      if (cond?.$regex) {
        const re = new RegExp(cond.$regex, cond.$options || '');
        if (!re.test(String(patient[field] ?? ''))) return false;
      }
    }
    if (filter.$expr?.$and) {
      const minDate = new Date(filter.$expr.$and[0].$gte[1]);
      const maxDate = new Date(filter.$expr.$and[1].$lte[1]);
      const dob = new Date(patient.dateOfBirth);
      if (!(dob >= minDate && dob <= maxDate)) return false;
    }
    if (Array.isArray(filter.$and)) {
      for (const part of filter.$and) {
        if (
          Array.isArray(part.$or) &&
          !part.$or.some((clause: any) => fieldMatches(patient, clause))
        ) {
          return false;
        }
      }
    }
    if (
      Array.isArray(filter.$or) &&
      !filter.$or.some((clause: any) => fieldMatches(patient, clause))
    ) {
      return false;
    }
    return true;
  });
}

function queryResult(rows: any[]) {
  let skipped = 0;
  let limited: number | null = null;
  const sliced = () => {
    const end = limited == null ? rows.length : skipped + limited;
    return rows.slice(skipped, end);
  };
  const result: any = {
    skip(n: number) {
      skipped = Number(n) || 0;
      return result;
    },
    limit(n: number) {
      limited = Number(n);
      return result;
    },
    populate() {
      return result;
    },
    sort() {
      return result;
    },
    lean() {
      return Promise.resolve(rows);
    },
    then(resolve: any, reject: any) {
      return Promise.resolve(sliced()).then(resolve, reject);
    },
  };
  return result;
}

describe('PatientsService partial search', () => {
  let service: PatientsService;

  const pipe = new ValidationPipe({
    transform: true,
    whitelist: true,
  });

  const shadanId = new Types.ObjectId();
  const rashidId = new Types.ObjectId();
  const deletedId = new Types.ObjectId();
  const shadanDoctor = new Types.ObjectId();
  const rashidDoctor = new Types.ObjectId();

  const shadan = {
    _id: shadanId,
    name: 'Shadan',
    mrn: '00002',
    phoneNumber: '9876543201',
    gender: 'Male',
    dateOfBirth: yearsAgo(22),
    addressLine1: 'Beach Road',
    city: 'Kochi',
    district: 'Ernakulam',
    state: 'Kerala',
    pinCode: '682001',
    country: 'India',
    uhid: 'UH00002',
    doctor: shadanDoctor,
    status: PatientStatus.ACTIVE,
    conditions: ['Diabetes'],
    createdAt: new Date('2024-02-01T00:00:00.000Z'),
  };

  const rashid = {
    _id: rashidId,
    name: 'Rashid',
    mrn: '00001',
    phoneNumber: '9876543210',
    gender: 'Male',
    dateOfBirth: yearsAgo(0),
    addressLine1: 'SM Street',
    city: 'Kozhikode',
    district: 'Kozhikode',
    state: 'Kerala',
    pinCode: '673001',
    country: 'India',
    uhid: 'UH00001',
    doctor: rashidDoctor,
    status: PatientStatus.ACTIVE,
    conditions: [],
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const deleted = {
    _id: deletedId,
    name: 'Shadan Archive',
    mrn: '00099',
    phoneNumber: '9000000000',
    gender: 'Male',
    dateOfBirth: yearsAgo(40),
    addressLine1: 'Old Road',
    city: 'Kochi',
    district: 'Ernakulam',
    state: 'Kerala',
    pinCode: '682001',
    country: 'India',
    status: PatientStatus.DELETED,
    conditions: [],
    createdAt: new Date('2020-01-01T00:00:00.000Z'),
  };

  const patients = [shadan, rashid, deleted];

  const appointmentModel = {
    distinct: jest.fn().mockResolvedValue([]),
  };

  const patientModel = {
    find: jest.fn((filter: any) => queryResult(applyFilter(patients, filter))),
    countDocuments: jest.fn(
      async (filter: any) => applyFilter(patients, filter).length,
    ),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: getModelToken(Patient.name), useValue: patientModel },
        {
          provide: getModelToken(Appointment.name),
          useValue: appointmentModel,
        },
      ],
    }).compile();

    service = module.get(PatientsService);
  });

  beforeEach(() => {
    appointmentModel.distinct.mockReset();
    appointmentModel.distinct.mockResolvedValue([]);
  });

  async function acceptQuery(query: Record<string, unknown>) {
    return pipe.transform(query, {
      type: 'query',
      metatype: GetPatientsDto,
    }) as Promise<GetPatientsDto>;
  }

  async function search(query: Record<string, unknown>) {
    return service.getPatient(await acceptQuery(query));
  }

  function names(result: { data: { name: string }[] }) {
    return result.data.map((patient) => patient.name);
  }

  it('keeps partial-search and directory filters through the whitelist pipe', async () => {
    const dto = await acceptQuery({
      query: 'sha',
      q: 'sha',
      gender: 'Male',
      doctor: shadanDoctor.toString(),
      minAge: '18',
      maxAge: '30',
      address: 'Beach',
      city: 'Kochi',
      district: 'Ernakulam',
      state: 'Kerala',
      pincode: '682001',
      page: '1',
      limit: '20',
    });

    expect(dto.query).toBe('sha');
    expect(dto.gender).toBe('Male');
    expect(dto.doctor).toBe(shadanDoctor.toString());
    expect(dto.minAge).toBe(18);
    expect(dto.maxAge).toBe(30);
    expect(dto.address).toBe('Beach');
    expect(dto.city).toBe('Kochi');
    expect(dto.district).toBe('Ernakulam');
    expect(dto.state).toBe('Kerala');
    expect(dto.pincode).toBe('682001');
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
  });

  it('query sha returns Shadan and not Rashid', async () => {
    const result = await search({ query: 'sha' });
    expect(names(result)).toEqual(['Shadan']);
    expect(result.total).toBe(1);
  });

  it('query Ras returns Rashid and not Shadan', async () => {
    const result = await search({ query: 'Ras' });
    expect(names(result)).toEqual(['Rashid']);
    expect(result.total).toBe(1);
  });

  it('matches name, phone, and OP number case-insensitively', async () => {
    expect(names(await search({ query: 'SHA' }))).toEqual(['Shadan']);
    expect(names(await search({ query: 'ras' }))).toEqual(['Rashid']);
    expect(names(await search({ query: '9876543201' }))).toEqual(['Shadan']);
    expect(names(await search({ query: '9876543210' }))).toEqual(['Rashid']);
    expect(names(await search({ query: '00002' }))).toEqual(['Shadan']);
    expect(names(await search({ query: '00001' }))).toEqual(['Rashid']);
    expect(names(await search({ q: 'sha' }))).toEqual(['Shadan']);
  });

  it('does not treat the query as a regular expression', async () => {
    const result = await search({ query: '.' });
    expect(names(result)).toEqual([]);
    await expect(search({ query: '(Ra' })).resolves.toMatchObject({
      data: [],
      total: 0,
    });
  });

  it('applies gender, doctor, and age together with search', async () => {
    expect(names(await search({ gender: 'Female' }))).toEqual([]);
    expect(names(await search({ gender: 'Male', query: 'sha' }))).toEqual([
      'Shadan',
    ]);
    expect(names(await search({ doctor: shadanDoctor.toString() }))).toEqual([
      'Shadan',
    ]);
    expect(names(await search({ minAge: '18', maxAge: '30' }))).toEqual([
      'Shadan',
    ]);
    expect(names(await search({ minAge: '0', maxAge: '5' }))).toEqual([
      'Rashid',
    ]);
    expect(names(await search({ query: 'sha', city: 'Kozhikode' }))).toEqual(
      [],
    );
  });

  it('applies address, city, district, state, and pincode as substrings', async () => {
    expect(names(await search({ address: 'Beach' }))).toEqual(['Shadan']);
    expect(names(await search({ address: 'SM Street' }))).toEqual(['Rashid']);
    expect(names(await search({ city: 'Kochi' }))).toEqual(['Shadan']);
    expect(names(await search({ district: 'Ernakulam' }))).toEqual(['Shadan']);
    expect(names(await search({ state: 'Kerala' })).sort()).toEqual([
      'Rashid',
      'Shadan',
    ]);
    expect(names(await search({ state: 'Goa' }))).toEqual([]);
    expect(names(await search({ pincode: '682001' }))).toEqual(['Shadan']);
    expect(names(await search({ pincode: '673001' }))).toEqual(['Rashid']);
  });

  it('reset (no filters) returns every active patient and hides deleted rows', async () => {
    const result = await search({});
    expect(names(result).sort()).toEqual(['Rashid', 'Shadan']);
    expect(result.total).toBe(2);
  });

  it('keeps status, consulted-only, and created-at filters', async () => {
    expect(names(await search({ status: 'Inactive' }))).toEqual([]);

    appointmentModel.distinct.mockResolvedValue([shadanId]);
    expect(names(await search({ consultedOnly: 'true' }))).toEqual(['Shadan']);

    expect(
      names(
        await search({
          from: '2025-01-01T00:00:00.000Z',
          to: '2025-02-01T00:00:00.000Z',
        }),
      ),
    ).toEqual([]);

    expect(
      names(await search({ conditions: JSON.stringify(['Diabetes']) })),
    ).toEqual(['Shadan']);
  });

  it('respects limit so a shared phone prefix does not dump every row', async () => {
    const result = await search({ query: '98765432', limit: '1', page: '1' });
    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Shadan');
  });
});
