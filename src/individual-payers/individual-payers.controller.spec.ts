import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { IndividualPayersController } from './individual-payers.controller';

describe('IndividualPayersController security metadata', () => {
  it('enforces authentication and admin roles on every endpoint', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, IndividualPayersController),
    ).toEqual([JwtAuthGuard, RolesGuard]);

    for (const handler of [
      'create',
      'findAll',
      'findOne',
      'update',
      'remove',
    ] as const) {
      expect(
        Reflect.getMetadata(
          ROLES_KEY,
          IndividualPayersController.prototype[handler],
        ),
      ).toEqual([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    }
  });
});
