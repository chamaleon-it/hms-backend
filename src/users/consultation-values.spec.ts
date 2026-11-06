import { BadRequestException } from '@nestjs/common';
import { Types, Model } from 'mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserRole } from './schemas/user.schema';

const options = (item: string) => JSON.stringify({
  presentHistory: [item], pastHistory: [], diagnosis: [],
});

describe('doctor consultation options', () => {
  it('saves, retrieves and deletes only the authenticated doctor’s options across sessions', async () => {
    const records = new Map<string, { consultationValues: string | null; save: () => Promise<void> }>();
    const doctorA = new Types.ObjectId();
    const doctorB = new Types.ObjectId();
    for (const id of [doctorA, doctorB]) {
      records.set(String(id), { consultationValues: null, save: async () => {} });
    }
    const model = {
      findById: jest.fn((id: Types.ObjectId) => ({
        select: () => {
          const record = records.get(String(id));
          return Object.assign(Promise.resolve(record), { lean: async () => record });
        },
      })),
    } as unknown as Model<User>;
    const controller = new UsersController(new UsersService(model));
    const userA = { id: doctorA, email: 'a@example.com', role: UserRole.DOCTOR };
    const userB = { id: doctorB, email: 'b@example.com', role: UserRole.DOCTOR };

    expect((await controller.getConsultationValues(userA)).data).toBeNull();
    await controller.syncConsultationValues(userA, { value: options('A condition') });
    await controller.syncConsultationValues(userB, { value: options('B condition') });
    const anotherSession = new UsersController(new UsersService(model));
    expect((await anotherSession.getConsultationValues(userA)).data).toBe(options('A condition'));
    expect((await anotherSession.getConsultationValues(userB)).data).toBe(options('B condition'));
    const empty = JSON.stringify({ presentHistory: [], pastHistory: [], diagnosis: [] });
    await anotherSession.syncConsultationValues(userA, { value: empty });
    expect((await controller.getConsultationValues(userA)).data).toBe(empty);
    expect((await controller.getConsultationValues(userB)).data).toBe(options('B condition'));
  });

  it.each(['bad json', 'null', '{}', '{"presentHistory": "wrong", "pastHistory": [], "diagnosis": []}',
    '{"presentHistory": [12], "pastHistory": [], "diagnosis": []}'])('rejects malformed options before writing: %s', async (value) => {
    const model = { findById: jest.fn() } as unknown as Model<User>;
    await expect(new UsersService(model).syncConsultationValues(new Types.ObjectId(), value))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(model.findById).not.toHaveBeenCalled();
  });
});
