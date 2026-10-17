import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { PlanContractsController } from './plan-contracts.controller';

describe('PlanContractsController security metadata', () => {
  it('enforces authentication and role guards', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, PlanContractsController),
    ).toEqual([JwtAuthGuard, RolesGuard]);
  });

  it('limits every contract operation to admins', () => {
    for (const method of [
      'create',
      'findAll',
      'findOne',
      'addBeneficiary',
      'removeBeneficiary',
    ] as const) {
      expect(
        Reflect.getMetadata(
          ROLES_KEY,
          PlanContractsController.prototype[method],
        ),
      ).toEqual([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    }
  });
});
