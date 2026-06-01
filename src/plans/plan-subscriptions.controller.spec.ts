import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { PlanSubscriptionsController } from './plan-subscriptions.controller';

describe('PlanSubscriptionsController security metadata', () => {
  it('enforces JwtAuthGuard and RolesGuard at controller level', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PlanSubscriptionsController,
    ) as Array<{ name: string }>;

    expect(guards).toEqual([JwtAuthGuard, RolesGuard]);
  });

  it('applies expected roles per endpoint', () => {
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        PlanSubscriptionsController.prototype.create,
      ),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        PlanSubscriptionsController.prototype.findAll,
      ),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        PlanSubscriptionsController.prototype.findOne,
      ),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        PlanSubscriptionsController.prototype.update,
      ),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        PlanSubscriptionsController.prototype.remove,
      ),
    ).toEqual([UserRole.ADMIN]);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        PlanSubscriptionsController.prototype.assignFamilyMember,
      ),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        PlanSubscriptionsController.prototype.getFamilyMembers,
      ),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        PlanSubscriptionsController.prototype.removeFamilyMember,
      ),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        PlanSubscriptionsController.prototype.findActiveByPatientId,
      ),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        PlanSubscriptionsController.prototype.validateFamilyMember,
      ),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
  });
});
