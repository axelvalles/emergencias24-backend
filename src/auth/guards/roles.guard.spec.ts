import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/entities/user.entity';

describe('RolesGuard', () => {
  function createExecutionContext(role: UserRole): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: { role },
        }),
      }),
    } as unknown as ExecutionContext;
  }

  function createGuard(requiredRoles: UserRole[]) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
    };

    return new RolesGuard(reflector as unknown as Reflector);
  }

  it('allows admins to satisfy the new operational roles', () => {
    const guard = createGuard([UserRole.PARAMEDIC]);

    expect(guard.canActivate(createExecutionContext(UserRole.ADMIN))).toBe(
      true,
    );

    const doctorGuard = createGuard([UserRole.DOCTOR]);
    expect(
      doctorGuard.canActivate(createExecutionContext(UserRole.ADMIN)),
    ).toBe(true);

    const marketingGuard = createGuard([UserRole.MARKETING]);
    expect(
      marketingGuard.canActivate(createExecutionContext(UserRole.ADMIN)),
    ).toBe(true);
  });

  it('keeps operational roles scoped to themselves', () => {
    const guard = createGuard([UserRole.PARAMEDIC]);

    expect(guard.canActivate(createExecutionContext(UserRole.DOCTOR))).toBe(
      false,
    );
    expect(guard.canActivate(createExecutionContext(UserRole.PARAMEDIC))).toBe(
      true,
    );
  });
});
