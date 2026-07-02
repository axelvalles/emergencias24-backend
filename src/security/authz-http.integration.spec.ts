import { Test, TestingModule } from '@nestjs/testing';
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import request from 'supertest';
import { Reflector } from '@nestjs/core';
import { CompaniesController } from '../companies/companies.controller';
import { CompaniesService } from '../companies/services/companies.service';
import { PlansController } from '../plans/plans.controller';
import { PlansService } from '../plans/services/plans.service';
import { PlanSubscriptionsController } from '../plans/plan-subscriptions.controller';
import { PlanSubscriptionsService } from '../plans/services/plan-subscriptions.service';
import { TicketsController } from '../tickets/tickets.controller';
import { TicketsService } from '../tickets/tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

type TestUser = {
  id: string;
  role: UserRole;
};

class AuthState {
  currentUser: TestUser | null = null;
}

class TestRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{ user?: TestUser }>();
    if (!req.user) {
      return false;
    }

    return requiredRoles.includes(req.user.role);
  }
}

describe('AuthZ HTTP integration matrix', () => {
  let app: INestApplication;
  const authState = new AuthState();

  const companiesServiceMock = {
    create: jest.fn(),
    findWithPagination: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findOne: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
    activate: jest.fn(),
    remove: jest.fn(),
  };

  const plansServiceMock = {
    create: jest.fn(),
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findOne: jest.fn(),
    update: jest.fn(),
    deactivate: jest.fn(),
    activate: jest.fn(),
    remove: jest.fn(),
  };

  const planSubscriptionsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    assignFamilyMember: jest.fn(),
    getFamilyMembers: jest.fn(),
    removeFamilyMember: jest.fn(),
    findActiveByPatientId: jest.fn(),
    validateFamilyMemberEligibility: jest.fn(),
  };

  const ticketsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findOne: jest.fn(),
    getHistory: jest.fn(),
    findByReferenceNumber: jest.fn(),
    assignTicket: jest.fn(),
    startTicket: jest.fn(),
    completeTicket: jest.fn(),
    updateNote: jest.fn(),
    cancelTicket: jest.fn(),
  };

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [
        CompaniesController,
        PlansController,
        PlanSubscriptionsController,
        TicketsController,
      ],
      providers: [
        { provide: CompaniesService, useValue: companiesServiceMock },
        { provide: PlansService, useValue: plansServiceMock },
        {
          provide: PlanSubscriptionsService,
          useValue: planSubscriptionsServiceMock,
        },
        { provide: TicketsService, useValue: ticketsServiceMock },
        Reflector,
        { provide: RolesGuard, useClass: TestRolesGuard },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest<{ user?: TestUser }>();
          if (!authState.currentUser) {
            throw new UnauthorizedException();
          }
          req.user = authState.currentUser;
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useFactory({
        factory: (reflector: Reflector) => new TestRolesGuard(reflector),
        inject: [Reflector],
      });

    const moduleRef: TestingModule = await moduleBuilder.compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    authState.currentUser = null;
  });

  it('returns 401 for unauthenticated requests', async () => {
    await request(app.getHttpServer()).get('/companies').expect(401);
    await request(app.getHttpServer()).get('/plans').expect(401);
    await request(app.getHttpServer()).get('/plan-subscriptions').expect(401);
    await request(app.getHttpServer()).get('/tickets').expect(401);
  });

  it('returns 200 for dispatcher on allowed read endpoints', async () => {
    authState.currentUser = { id: 'dispatcher-1', role: UserRole.DISPATCHER };

    await request(app.getHttpServer()).get('/companies').expect(200);
    await request(app.getHttpServer()).get('/plans').expect(200);
    await request(app.getHttpServer()).get('/plan-subscriptions').expect(200);
    await request(app.getHttpServer()).get('/tickets').expect(200);
  });

  it('returns 200 for operational roles on ticket read endpoints added by role routing', async () => {
    const allowedUsers: TestUser[] = [
      { id: 'doctor-1', role: UserRole.DOCTOR },
      {
        id: 'appointment-manager-1',
        role: UserRole.APPOINTMENT_MANAGER,
      },
      { id: 'marketing-1', role: UserRole.MARKETING },
      { id: 'paramedic-1', role: UserRole.PARAMEDIC },
      { id: 'super-admin-1', role: UserRole.SUPER_ADMIN },
    ];

    for (const user of allowedUsers) {
      authState.currentUser = user;

      await request(app.getHttpServer()).get('/tickets').expect(200);
      await request(app.getHttpServer())
        .get('/tickets/019e79f9-9941-758b-9bd2-18f4d1da9148/history')
        .expect(200);
    }
  });

  it('returns 403 for dispatcher on admin-only endpoint', async () => {
    authState.currentUser = { id: 'dispatcher-1', role: UserRole.DISPATCHER };

    await request(app.getHttpServer())
      .delete('/companies/019e79f9-9941-758b-9bd2-18f4d1da9148')
      .expect(403);
  });

  it('returns 200 for admin on admin-only endpoint', async () => {
    authState.currentUser = { id: 'admin-1', role: UserRole.ADMIN };

    await request(app.getHttpServer())
      .delete('/companies/019e79f9-9941-758b-9bd2-18f4d1da9148')
      .expect(200);
  });

  it('returns 403 for operational roles on privileged ticket handoff endpoints', async () => {
    const restrictedUsers: TestUser[] = [
      { id: 'doctor-1', role: UserRole.DOCTOR },
      {
        id: 'appointment-manager-1',
        role: UserRole.APPOINTMENT_MANAGER,
      },
      { id: 'marketing-1', role: UserRole.MARKETING },
      { id: 'paramedic-1', role: UserRole.PARAMEDIC },
    ];

    for (const user of restrictedUsers) {
      authState.currentUser = user;

      await request(app.getHttpServer())
        .patch('/tickets/019e79f9-9941-758b-9bd2-18f4d1da9148/assign')
        .send({ ownerRole: UserRole.DOCTOR })
        .expect(403);
    }
  });
});
