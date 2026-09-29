/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { Types } from 'mongoose';
import { PatientsService } from './patients.service';
import { GetPatientsDto } from './dto/get-patients.dto';
import { Gender, PatientStatus } from './schemas/patient.schema';

// Mirrors the global pipe configured in src/main.ts.
const pipe = new ValidationPipe({ transform: true, whitelist: true });
const runPipe = (query: Record<string, unknown>) =>
  pipe.transform(query, {
    type: 'query',
    metatype: GetPatientsDto,
  }) as Promise<GetPatientsDto>;

const doctorId = new Types.ObjectId();

const shadan = {
  _id: new Types.ObjectId(),
  name: 'Shadan',
  mrn: '00002',
  phoneNumber: '9000000002',
  gender: Gender.MALE,
  state: 'Kerala',
  country: 'India',
  status: PatientStatus.ACTIVE,
  doctor: doctorId,
  createdAt: new Date('2026-01-02'),
};

const rashid = {
  _id: new Types.ObjectId(),
  name: 'Rashid',
  mrn: '00001',
  phoneNumber: '9000000001',
  gender: Gender.FEMALE,
  state: 'Kerala',
  country: 'India',
  status: PatientStatus.ACTIVE,
  doctor: null,
  createdAt: new Date('2026-01-01'),
};

const matches = (doc: any, filter: Record<string, any>): boolean =>
  Object.entries(filter).every(([key, cond]) => {
    if (key === '$or') return cond.some((c: any) => matches(doc, c));
    if (key === '$and') return cond.every((c: any) => matches(doc, c));
    const value = doc[key];
    if (cond && typeof cond === 'object' && !(cond instanceof Types.ObjectId)) {
      if ('$regex' in cond)
        return (
          typeof value === 'string' &&
          new RegExp(cond.$regex, cond.$options).test(value)
        );
      if ('$ne' in cond) return value !== cond.$ne;
      if ('$in' in cond) return cond.$in.includes(value);
    }
    if (cond instanceof Types.ObjectId)
      return value != null && String(value) === String(cond);
    return value === cond;
  });

const chain = <T>(result: T) => {
  const self: any = {
    skip: () => self,
    limit: () => self,
    populate: () => self,
    sort: () => self,
    lean: () => self,
    exec: () => Promise.resolve(result),
    then: (resolve: (v: T) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return self;
};

const makeService = (docs: any[]) => {
  const patientModel = {
    find: (filter: Record<string, any>) =>
      chain(docs.filter((d) => matches(d, filter))),
    countDocuments: (filter: Record<string, any>) =>
      Promise.resolve(docs.filter((d) => matches(d, filter)).length),
  };
  const appointmentModel = { distinct: () => Promise.resolve([]) };
  return new PatientsService(patientModel as any, appointmentModel as any);
};

const names = (result: { data: any[] }) => result.data.map((p) => p.name);

describe('GET /patients query filters survive the global ValidationPipe', () => {
  it('keeps search and filter params instead of whitelisting them away', async () => {
    const dto = await runPipe({
      query: 'sha',
      q: 'sha',
      gender: 'Male',
      doctor: doctorId.toHexString(),
      minAge: '0',
      maxAge: '100',
      address: 'Kochi',
      city: 'Kochi',
      district: 'Ernakulam',
      state: 'Kerala',
      pincode: '682001',
      consultedOnly: 'true',
      page: '2',
      limit: '25',
    });

    expect(dto).toMatchObject({
      query: 'sha',
      q: 'sha',
      gender: 'Male',
      doctor: doctorId.toHexString(),
      minAge: '0',
      maxAge: '100',
      address: 'Kochi',
      city: 'Kochi',
      district: 'Ernakulam',
      state: 'Kerala',
      pincode: '682001',
      consultedOnly: 'true',
      page: 2,
      limit: 25,
    });
  });

  it('applies defaults when page/limit are omitted', async () => {
    const dto = await runPipe({});
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(100);
  });
});

describe('PatientsService.getPatient with pipe-processed query', () => {
  const service = makeService([shadan, rashid]);

  it('search "sha" returns Shadan but not Rashid', async () => {
    const result = await service.getPatient(await runPipe({ query: 'sha' }));
    expect(names(result)).toEqual(['Shadan']);
    expect(result.total).toBe(1);
  });

  it('search "Ras" returns Rashid but not Shadan', async () => {
    const result = await service.getPatient(await runPipe({ query: 'Ras' }));
    expect(names(result)).toEqual(['Rashid']);
    expect(result.total).toBe(1);
  });

  it('gender filter restricts the customer list', async () => {
    const result = await service.getPatient(
      await runPipe({ gender: 'Female' }),
    );
    expect(names(result)).toEqual(['Rashid']);
  });

  it('doctor filter restricts the customer list', async () => {
    const result = await service.getPatient(
      await runPipe({ doctor: doctorId.toHexString() }),
    );
    expect(names(result)).toEqual(['Shadan']);
  });

  it('returns everyone when no query is given', async () => {
    const result = await service.getPatient(await runPipe({}));
    expect(names(result).sort()).toEqual(['Rashid', 'Shadan']);
  });
});
