import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { TicketsController } from '../src/tickets/tickets.controller';
import { TICKET_OWNER_ROLE } from '../src/tickets/ticket-owner-role';
import { TicketsService } from '../src/tickets/tickets.service';
import { UserRole } from '../src/users/entities/user.entity';

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

describe('Tickets role-routing HTTP flow (e2e)', () => {
  let app: INestApplication<App>;
  const authState = new AuthState();

  const ticketsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findOne: jest.fn(),
    getHistory: jest.fn().mockResolvedValue([
      {
        id: 'history-1',
        eventType: 'handoff',
        toOwnerRole: TICKET_OWNER_ROLE.DOCTOR,
      },
    ]),
    findByReferenceNumber: jest.fn(),
    assignTicket: jest.fn().mockImplementation(async (id, action, user) => ({
      id,
      ...action,
      actedBy: user.id,
    })),
    startTicket: jest.fn(),
    completeTicket: jest.fn(),
    updateNote: jest.fn(),
    cancelTicket: jest.fn(),
  };

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
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
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    authState.currentUser = null;
    jest.clearAllMocks();
    ticketsServiceMock.findAll.mockResolvedValue({ data: [], total: 0 });
    ticketsServiceMock.getHistory.mockResolvedValue([
      {
        id: 'history-1',
        eventType: 'handoff',
        toOwnerRole: TICKET_OWNER_ROLE.DOCTOR,
      },
    ]);
    ticketsServiceMock.assignTicket.mockImplementation(
      async (id, action, user) => ({
        id,
        ...action,
        actedBy: user.id,
      }),
    );
  });

  it('lets operational queue roles read their routed ticket history endpoint', async () => {
    authState.currentUser = { id: 'marketing-1', role: UserRole.MARKETING };

    const response = await request(app.getHttpServer())
      .get('/tickets/019e79f9-9941-758b-9bd2-18f4d1da9148/history')
      .expect(200);

    expect(response.body).toEqual([
      expect.objectContaining({
        id: 'history-1',
        eventType: 'handoff',
        toOwnerRole: TICKET_OWNER_ROLE.DOCTOR,
      }),
    ]);
    expect(ticketsServiceMock.getHistory).toHaveBeenCalledWith(
      '019e79f9-9941-758b-9bd2-18f4d1da9148',
      { id: 'marketing-1', role: UserRole.MARKETING },
    );
  });

  it('rejects privileged handoff routes for doctor users', async () => {
    authState.currentUser = { id: 'doctor-1', role: UserRole.DOCTOR };

    await request(app.getHttpServer())
      .patch('/tickets/019e79f9-9941-758b-9bd2-18f4d1da9148/assign')
      .send({ ownerRole: TICKET_OWNER_ROLE.MARKETING, comment: 'Escalate' })
      .expect(403);

    expect(ticketsServiceMock.assignTicket).not.toHaveBeenCalled();
  });

  it('validates owner-role values before a dispatcher handoff is accepted', async () => {
    authState.currentUser = { id: 'dispatcher-1', role: UserRole.DISPATCHER };

    await request(app.getHttpServer())
      .patch('/tickets/019e79f9-9941-758b-9bd2-18f4d1da9148/assign')
      .send({ ownerRole: 'invalid-owner-role', comment: 'Escalate' })
      .expect(400);

    expect(ticketsServiceMock.assignTicket).not.toHaveBeenCalled();
  });

  it('forces paramedic ownership on unit assignment compatibility routes', async () => {
    authState.currentUser = { id: 'dispatcher-1', role: UserRole.DISPATCHER };

    const response = await request(app.getHttpServer())
      .patch(
        '/tickets/019e79f9-9941-758b-9bd2-18f4d1da9148/assign/019e79f9-9941-758b-9bd2-18f4d1da9150',
      )
      .send({
        ownerRole: TICKET_OWNER_ROLE.DOCTOR,
        comment: 'Send mobile unit',
      })
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: '019e79f9-9941-758b-9bd2-18f4d1da9148',
        ownerRole: TICKET_OWNER_ROLE.PARAMEDIC,
        ambulanceUnitId: '019e79f9-9941-758b-9bd2-18f4d1da9150',
        comment: 'Send mobile unit',
        actedBy: 'dispatcher-1',
      }),
    );
    expect(ticketsServiceMock.assignTicket).toHaveBeenCalledWith(
      '019e79f9-9941-758b-9bd2-18f4d1da9148',
      {
        ownerRole: TICKET_OWNER_ROLE.PARAMEDIC,
        ambulanceUnitId: '019e79f9-9941-758b-9bd2-18f4d1da9150',
        comment: 'Send mobile unit',
      },
      { id: 'dispatcher-1', role: UserRole.DISPATCHER },
    );
  });
});
