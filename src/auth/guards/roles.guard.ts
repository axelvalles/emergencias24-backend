import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/entities/user.entity';

const ROLE_HIERARCHY: Record<UserRole, readonly UserRole[]> = {
  [UserRole.SUPER_ADMIN]: [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DISPATCHER,
    UserRole.PARAMEDIC,
    UserRole.DOCTOR,
    UserRole.APPOINTMENT_MANAGER,
    UserRole.MARKETING,
  ],
  [UserRole.ADMIN]: [
    UserRole.ADMIN,
    UserRole.DISPATCHER,
    UserRole.PARAMEDIC,
    UserRole.DOCTOR,
    UserRole.APPOINTMENT_MANAGER,
    UserRole.MARKETING,
  ],
  [UserRole.DISPATCHER]: [UserRole.DISPATCHER],
  [UserRole.PARAMEDIC]: [UserRole.PARAMEDIC],
  [UserRole.DOCTOR]: [UserRole.DOCTOR],
  [UserRole.APPOINTMENT_MANAGER]: [UserRole.APPOINTMENT_MANAGER],
  [UserRole.MARKETING]: [UserRole.MARKETING],
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRole) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    const rawUserRoles = Array.isArray(user?.role)
      ? user.role
      : typeof user?.role === 'string'
        ? [user.role]
        : [];

    const normalizedUserRoles = rawUserRoles.filter((role): role is UserRole =>
      Object.values(UserRole).includes(role as UserRole),
    );

    const hasRole = normalizedUserRoles.some((userRole) =>
      requiredRole.some((role) => ROLE_HIERARCHY[userRole].includes(role)),
    );

    return hasRole;
  }
}
