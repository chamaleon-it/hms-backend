import { BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';

describe('AdminService availability + reports helpers', () => {
  const service = Object.create(AdminService.prototype) as AdminService;

  it('rejects end time before start time', () => {
    expect(() =>
      service.validateAvailability({
        startTime: '17:00',
        endTime: '09:00',
        days: ['Mon'],
        rounds: [],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects overlapping rounds', () => {
    expect(() =>
      service.validateAvailability({
        startTime: '09:00',
        endTime: '17:00',
        days: ['Mon'],
        rounds: [
          { label: 'A', start: '10:00', end: '12:00' },
          { label: 'B', start: '11:00', end: '13:00' },
        ],
      }),
    ).toThrow(BadRequestException);
  });

  it('accepts valid multi-round day schedule', () => {
    const result = service.validateAvailability({
      startTime: '09:00',
      endTime: '17:00',
      days: ['Mon', 'Tue'],
      rounds: [
        { label: 'Lunch', start: '13:00', end: '14:00' },
        { label: 'OT', start: '15:00', end: '16:00' },
      ],
      slotIntervalMinutes: 15,
    });
    expect(result.days).toEqual(['Mon', 'Tue']);
    expect(result.rounds).toHaveLength(2);
    expect(result.slotIntervalMinutes).toBe(15);
  });
});
