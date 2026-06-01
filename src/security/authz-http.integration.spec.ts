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

  it('returns 200 for operator on allowed read endpoints', async () => {
    authState.currentUser = { id: 'operator-1', role: UserRole.OPERATOR };

    await request(app.getHttpServer()).get('/companies').expect(200);
    await request(app.getHttpServer()).get('/plans').expect(200);
    await request(app.getHttpServer()).get('/plan-subscriptions').expect(200);
    await request(app.getHttpServer()).get('/tickets').expect(200);
  });

  it('returns 403 for operator on admin-only endpoint', async () => {
    authState.currentUser = { id: 'operator-1', role: UserRole.OPERATOR };

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
});
