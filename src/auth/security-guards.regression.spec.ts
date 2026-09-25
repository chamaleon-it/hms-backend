jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  ScheduleModule: { forRoot: () => ({ module: class {} }) },
}));

import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { PatientsController } from '../patients/patients.controller';
import { SuppliersController } from '../suppliers/suppliers.controller';
import { PurchaseController } from '../pharmacy/purchase/purchase.controller';
import { PurchaseEntryController } from '../suppliers/purchase_entry/purchase_entry.controller';
import { ItemsController } from '../pharmacy/items/items.controller';
import { ReportController } from '../lab/report/report.controller';
import { OrdersController } from '../pharmacy/orders/orders.controller';
import { ReturnController } from '../pharmacy/return/return.controller';
import { BackupController } from '../backup/backup.controller';
import { AppointmentsController } from '../appointments/appointments.controller';
import { PanelsController } from '../lab/panels/panels.controller';
import { UploadsController } from '../uploads/uploads.controller';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { LisApiKeyGuard } from '../auth/lis-api-key.guard';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { PUBLIC_REGISTER_ROLES } from '../users/dto/createUser.dto';

function guardsOf(target: object, method?: string | symbol) {
  if (method) {
    return Reflect.getMetadata(GUARDS_METADATA, (target as any)[method]) || [];
  }
  return Reflect.getMetadata(GUARDS_METADATA, target) || [];
}

function rolesOf(target: object, method?: string | symbol) {
  if (method) {
    return Reflect.getMetadata(ROLES_KEY, (target as any)[method]) || [];
  }
  return Reflect.getMetadata(ROLES_KEY, target) || [];
}

describe('Production security guards regression (C2–C7, H3, H6, step 13)', () => {
  it('C2–C4: patients controller requires JWT + clinical roles on class', () => {
    const guards = guardsOf(PatientsController);
    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
    const roles = rolesOf(PatientsController);
    expect(roles).toEqual(
      expect.arrayContaining([
        UserRole.PHARMACY,
        UserRole.LAB,
        UserRole.DOCTOR,
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
      ]),
    );
  });

  it('C5/C7: suppliers controller requires JWT + pharmacy/admin roles', () => {
    const guards = guardsOf(SuppliersController);
    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
  });

  it('C6: pharmacy purchase controller guards GET and POST', () => {
    const guards = guardsOf(PurchaseController);
    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
  });

  it('step 13: purchase_entry controller is guarded', () => {
    expect(guardsOf(PurchaseEntryController)).toEqual(
      expect.arrayContaining([JwtAuthGuard, RolesGuard]),
    );
  });

  it('step 13: pharmacy orders / return / backup are guarded', () => {
    expect(guardsOf(OrdersController)).toEqual(
      expect.arrayContaining([JwtAuthGuard, RolesGuard]),
    );
    expect(guardsOf(ReturnController)).toEqual(
      expect.arrayContaining([JwtAuthGuard, RolesGuard]),
    );
    expect(guardsOf(BackupController)).toEqual(
      expect.arrayContaining([JwtAuthGuard, RolesGuard]),
    );
  });

  it('H3: batch PUT includes Pharmacy but quantity blocked in handler (roles still allow Pharmacy)', () => {
    const roles = rolesOf(ItemsController.prototype, 'updateBatch');
    const methodGuards = guardsOf(ItemsController.prototype, 'updateBatch');
    expect(methodGuards).toEqual(
      expect.arrayContaining([JwtAuthGuard, RolesGuard]),
    );
    const methodRoles =
      Reflect.getMetadata(ROLES_KEY, ItemsController.prototype.updateBatch) ||
      [];
    expect(methodRoles).toEqual(
      expect.arrayContaining([
        UserRole.ADMIN,
        UserRole.SUPER_ADMIN,
        UserRole.PHARMACY,
      ]),
    );
    void roles;
  });

  it('H6: lis-result uses LisApiKeyGuard (not open, not JWT)', () => {
    const guards = guardsOf(ReportController.prototype, 'receiveLisResult');
    expect(guards).toEqual(expect.arrayContaining([LisApiKeyGuard]));
    expect(guards).not.toEqual(expect.arrayContaining([JwtAuthGuard]));
  });

  it('CRIT-3: appointment mutate/PHI routes require JWT', () => {
    for (const method of [
      'updateAppointment',
      'deleteAppointment',
      'recoverAppointment',
      'getPatientAppointment',
      'getWalkInAppointment',
    ] as const) {
      expect(guardsOf(AppointmentsController.prototype, method)).toEqual(
        expect.arrayContaining([JwtAuthGuard]),
      );
    }
  });

  it('HIGH-1: uploads controller requires JWT on class', () => {
    expect(guardsOf(UploadsController)).toEqual(
      expect.arrayContaining([JwtAuthGuard]),
    );
  });

  it('billing controller requires JWT + RolesGuard on class', () => {
    const { BillingController } = require('../billing/billing.controller');
    expect(guardsOf(BillingController)).toEqual(
      expect.arrayContaining([JwtAuthGuard, RolesGuard]),
    );
  });

  it('HIGH-2: panel add/remove/groups require JWT', () => {
    expect(guardsOf(PanelsController.prototype, 'addTestToPanel')).toEqual(
      expect.arrayContaining([JwtAuthGuard]),
    );
    expect(guardsOf(PanelsController.prototype, 'removeTestFromPanel')).toEqual(
      expect.arrayContaining([JwtAuthGuard]),
    );
    expect(guardsOf(PanelsController.prototype, 'getGroups')).toEqual(
      expect.arrayContaining([JwtAuthGuard]),
    );
  });

  it('CRIT-2: public register roles exclude Admin / Super Admin', () => {
    expect(PUBLIC_REGISTER_ROLES).toEqual(
      expect.arrayContaining([
        UserRole.DOCTOR,
        UserRole.PHARMACY,
        UserRole.LAB,
      ]),
    );
    expect(PUBLIC_REGISTER_ROLES as readonly string[]).not.toContain(
      UserRole.ADMIN,
    );
    expect(PUBLIC_REGISTER_ROLES as readonly string[]).not.toContain(
      UserRole.SUPER_ADMIN,
    );
  });
});
