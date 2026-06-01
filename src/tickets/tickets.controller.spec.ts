import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { TicketsController } from './tickets.controller';

describe('TicketsController security metadata', () => {
  it('enforces JwtAuthGuard and RolesGuard at controller level', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      TicketsController,
    ) as Array<{
      name: string;
    }>;

    expect(guards).toEqual([JwtAuthGuard, RolesGuard]);
  });

  it('applies expected roles per endpoint', () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, TicketsController.prototype.create),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
    expect(
      Reflect.getMetadata(ROLES_KEY, TicketsController.prototype.findAll),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
    expect(
      Reflect.getMetadata(ROLES_KEY, TicketsController.prototype.findOne),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
    expect(
      Reflect.getMetadata(ROLES_KEY, TicketsController.prototype.getHistory),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        TicketsController.prototype.findByReferenceNumber,
      ),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
    expect(
      Reflect.getMetadata(ROLES_KEY, TicketsController.prototype.assignTicket),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
    expect(
      Reflect.getMetadata(ROLES_KEY, TicketsController.prototype.startTicket),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        TicketsController.prototype.completeTicket,
      ),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
    expect(
      Reflect.getMetadata(ROLES_KEY, TicketsController.prototype.updateNote),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
    expect(
      Reflect.getMetadata(ROLES_KEY, TicketsController.prototype.cancelTicket),
    ).toEqual([UserRole.ADMIN, UserRole.OPERATOR]);
  });
});
