import { displayDoctorName, pickVisitDoctor } from './session-doctor';

describe('visit doctor on a therapy or procedure bill', () => {
  it('keeps a real doctor name and drops placeholders', () => {
    expect(displayDoctorName('Mukhthar')).toBe('Mukhthar');
    expect(displayDoctorName(' Dr. Mukhthar ')).toBe('Dr. Mukhthar');
    expect(displayDoctorName({ name: 'Mukhthar' })).toBe('Mukhthar');
    expect(displayDoctorName('-')).toBe('');
    expect(displayDoctorName('Self')).toBe('');
    expect(displayDoctorName('Doctor')).toBe('');
  });

  it('reads the visit doctor id and name, not a display-name string as an id', () => {
    const id = '64b7f0c2a1b2c3d4e5f60718';
    expect(
      pickVisitDoctor({
        doctor: id,
        doctorName: 'Dr. Mukhthar',
      }),
    ).toEqual({ id, name: 'Dr. Mukhthar' });
    expect(
      pickVisitDoctor({
        doctor: { _id: id, name: 'Mukhthar' },
        doctorName: 'Self',
      }),
    ).toEqual({ id, name: 'Mukhthar' });
    expect(pickVisitDoctor({ doctorName: 'Doctor' })).toEqual({
      id: null,
      name: '',
    });
  });
});
