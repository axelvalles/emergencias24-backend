import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { CompaniesController } from './companies.controller';

describe('CompaniesController security metadata', () => {
  it('enforces JwtAuthGuard and RolesGuard at controller level', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      CompaniesController,
    ) as Array<{
      name: string;
    }>;

    expect(guards).toEqual([JwtAuthGuard, RolesGuard]);
  });

  it('applies expected roles per endpoint', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, CompaniesController.prototype.create),
    ).toEqual([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        CompaniesController.prototype.findWithPagination,
      ),
    ).toEqual([UserRole.ADMIN, UserRole.DISPATCHER, UserRole.SUPER_ADMIN]);
    expect(
      Reflect.getMetadata(ROLES_KEY, CompaniesController.prototype.findOne),
    ).toEqual([UserRole.ADMIN, UserRole.DISPATCHER, UserRole.SUPER_ADMIN]);
    expect(
      Reflect.getMetadata(ROLES_KEY, CompaniesController.prototype.update),
    ).toEqual([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    expect(
      Reflect.getMetadata(ROLES_KEY, CompaniesController.prototype.deactivate),
    ).toEqual([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    expect(
      Reflect.getMetadata(ROLES_KEY, CompaniesController.prototype.activate),
    ).toEqual([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    expect(
      Reflect.getMetadata(ROLES_KEY, CompaniesController.prototype.remove),
    ).toEqual([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  });
});
