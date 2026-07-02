import { TicketsService } from './tickets.service';
import { Priority, ServiceType, TicketStatus } from './entities/ticket.entity';
import { UserRole } from 'src/users/entities/user.entity';
import { TICKET_OWNER_ROLE, type TicketOwnerRole } from './ticket-owner-role';

describe('TicketsService owner-role routing', () => {
  function createQueryBuilderMock() {
    return {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
  }

  function createTicketRepositoryMock() {
    return {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    };
  }

  function createHistoryRepositoryMock() {
    return {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      find: jest.fn(),
    };
  }

  function createHandoffRepositoryMock() {
    return {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      find: jest.fn(),
    };
  }

  function createGatewayMock() {
    return {
      emitTicketCreated: jest.fn(),
      emitTicketUpdated: jest.fn(),
      emitTicketAssigned: jest.fn(),
      emitTicketCompleted: jest.fn(),
      emitTicketCancelled: jest.fn(),
    };
  }

  function createPolicyMock() {
    return {
      resolveOwnerRole: jest.fn((serviceType: ServiceType) => {
        const ownerRoleByServiceType: Partial<
          Record<ServiceType, TicketOwnerRole>
        > = {
          [ServiceType.TELEMEDICINE]: TICKET_OWNER_ROLE.DOCTOR,
          [ServiceType.HOME_CARE]: TICKET_OWNER_ROLE.PARAMEDIC,
        };

        return ownerRoleByServiceType[serviceType] ?? null;
      }),
    };
  }

  it('routes a new telemedicine ticket to doctor ownership during creation', async () => {
    const ticketRepository = createTicketRepositoryMock();
    const historyRepository = createHistoryRepositoryMock();
    const handoffRepository = createHandoffRepositoryMock();
    const ticketsGateway = createGatewayMock();
    const ticketRoutingPolicy = createPolicyMock();

    const service = new TicketsService(
      ticketRepository as never,
      historyRepository as never,
      handoffRepository as never,
      ticketsGateway as never,
      {} as never,
      ticketRoutingPolicy as never,
    );

    const createdTicket = await service.create({
      serviceType: ServiceType.TELEMEDICINE,
      priority: Priority.MEDIUM,
      requesterPhone: '3000000000',
    });

    expect(ticketRoutingPolicy.resolveOwnerRole).toHaveBeenCalledWith(
      ServiceType.TELEMEDICINE,
    );
    expect(createdTicket.currentOwnerRole).toBe(TICKET_OWNER_ROLE.DOCTOR);
    expect(handoffRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ticket: expect.objectContaining({
          currentOwnerRole: TICKET_OWNER_ROLE.DOCTOR,
        }),
        fromOwnerRole: null,
        toOwnerRole: TICKET_OWNER_ROLE.DOCTOR,
        fromAssignedUnitId: null,
        toAssignedUnitId: null,
      }),
    );
  });

  it('filters doctor visibility by current owner role', async () => {
    const qb = createQueryBuilderMock();
    const ticketRepository = createTicketRepositoryMock();
    ticketRepository.createQueryBuilder.mockReturnValue(qb);

    const service = new TicketsService(
      ticketRepository as never,
      createHistoryRepositoryMock() as never,
      createHandoffRepositoryMock() as never,
      createGatewayMock() as never,
      {} as never,
      createPolicyMock() as never,
    );

    await service.findAll({}, {
      id: 'doctor-1',
      role: UserRole.DOCTOR,
    } as never);

    expect(qb.andWhere).toHaveBeenCalledWith(
      'ticket.currentOwnerRole = :currentOwnerRole',
      { currentOwnerRole: UserRole.DOCTOR },
    );
  });

  it('lets dispatchers see operational queues without owner-role filtering', async () => {
    const qb = createQueryBuilderMock();
    const ticketRepository = createTicketRepositoryMock();
    ticketRepository.createQueryBuilder.mockReturnValue(qb);

    const service = new TicketsService(
      ticketRepository as never,
      createHistoryRepositoryMock() as never,
      createHandoffRepositoryMock() as never,
      createGatewayMock() as never,
      {} as never,
      createPolicyMock() as never,
    );

    await service.findAll({}, {
      id: 'dispatcher-1',
      role: UserRole.DISPATCHER,
    } as never);

    expect(qb.andWhere).not.toHaveBeenCalledWith(
      'ticket.currentOwnerRole = :currentOwnerRole',
      expect.anything(),
    );
  });

  it('clears paramedic unit ownership when a privileged user hands off to doctor', async () => {
    const ticketRepository = createTicketRepositoryMock();
    const doctorOwnedTicket = {
      id: 'ticket-1',
      status: TicketStatus.ASSIGNED,
      currentOwnerRole: TICKET_OWNER_ROLE.PARAMEDIC,
      assignedUnit: { id: 'unit-1', members: [{ id: 'member-1' }] },
      assignedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    ticketRepository.findOne.mockResolvedValue(doctorOwnedTicket);

    const service = new TicketsService(
      ticketRepository as never,
      createHistoryRepositoryMock() as never,
      createHandoffRepositoryMock() as never,
      createGatewayMock() as never,
      {
        findOne: jest.fn().mockResolvedValue({
          id: 'unit-2',
          members: [{ id: 'member-2' }],
        }),
      } as never,
      createPolicyMock() as never,
    );

    const updatedTicket = await service.assignTicket(
      'ticket-1',
      {
        ownerRole: TICKET_OWNER_ROLE.DOCTOR,
        comment: 'Escalate to telemedicine',
      },
      {
        id: 'admin-1',
        role: UserRole.ADMIN,
      } as never,
    );

    expect(updatedTicket.currentOwnerRole).toBe(TICKET_OWNER_ROLE.DOCTOR);
    expect(updatedTicket.assignedUnit).toBeNull();
    expect(updatedTicket.assignedAt).toBeNull();
  });

  it('stores a handoff audit row when ownership changes', async () => {
    const ticketRepository = createTicketRepositoryMock();
    const historyRepository = createHistoryRepositoryMock();
    const handoffRepository = createHandoffRepositoryMock();
    const gateway = createGatewayMock();
    const assignedUnit = { id: 'unit-1', members: [{ id: 'member-1' }] };
    ticketRepository.findOne.mockResolvedValue({
      id: 'ticket-2',
      status: TicketStatus.ASSIGNED,
      currentOwnerRole: TICKET_OWNER_ROLE.PARAMEDIC,
      assignedUnit,
      assignedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const service = new TicketsService(
      ticketRepository as never,
      historyRepository as never,
      handoffRepository as never,
      gateway as never,
      {} as never,
      createPolicyMock() as never,
    );

    await service.assignTicket(
      'ticket-2',
      {
        ownerRole: TICKET_OWNER_ROLE.DOCTOR,
        comment: 'Escalate to telemedicine',
      },
      {
        id: 'dispatcher-1',
        role: UserRole.DISPATCHER,
      } as never,
    );

    expect(handoffRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ticket: expect.objectContaining({ id: 'ticket-2' }),
        fromOwnerRole: TICKET_OWNER_ROLE.PARAMEDIC,
        toOwnerRole: TICKET_OWNER_ROLE.DOCTOR,
        changedBy: expect.objectContaining({ id: 'dispatcher-1' }),
        fromAssignedUnitId: 'unit-1',
        toAssignedUnitId: null,
        note: 'Escalate to telemedicine',
      }),
    );
    expect(handoffRepository.save).toHaveBeenCalledTimes(1);
  });

  it('captures final owner-role and unit snapshot when completing a ticket', async () => {
    const ticketRepository = createTicketRepositoryMock();
    const historyRepository = createHistoryRepositoryMock();
    const handoffRepository = createHandoffRepositoryMock();
    ticketRepository.findOne.mockResolvedValue({
      id: 'ticket-3',
      status: TicketStatus.IN_PROGRESS,
      currentOwnerRole: TICKET_OWNER_ROLE.PARAMEDIC,
      assignedUnit: { id: 'unit-9' },
      completedAt: null,
    });

    const service = new TicketsService(
      ticketRepository as never,
      historyRepository as never,
      handoffRepository as never,
      createGatewayMock() as never,
      {} as never,
      createPolicyMock() as never,
    );

    await service.completeTicket(
      'ticket-3',
      {
        id: 'paramedic-1',
        role: UserRole.PARAMEDIC,
        ambulanceUnits: [{ id: 'unit-9' }],
        activeAmbulanceUnit: { id: 'unit-9' },
      } as never,
      'Patient stabilized',
    );

    expect(historyRepository.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: TicketStatus.COMPLETED,
        ownerRoleAtChange: TICKET_OWNER_ROLE.PARAMEDIC,
        assignedUnitIdSnapshot: 'unit-9',
        comment: 'Patient stabilized',
      }),
    );
  });

  it('captures final owner-role context when cancelling a ticket', async () => {
    const ticketRepository = createTicketRepositoryMock();
    const historyRepository = createHistoryRepositoryMock();
    ticketRepository.findOne.mockResolvedValue({
      id: 'ticket-4',
      status: TicketStatus.ASSIGNED,
      currentOwnerRole: TICKET_OWNER_ROLE.DOCTOR,
      assignedUnit: null,
    });

    const service = new TicketsService(
      ticketRepository as never,
      historyRepository as never,
      createHandoffRepositoryMock() as never,
      createGatewayMock() as never,
      {} as never,
      createPolicyMock() as never,
    );

    await service.cancelTicket(
      'ticket-4',
      {
        id: 'admin-2',
        role: UserRole.ADMIN,
      } as never,
      'Duplicate request',
    );

    expect(historyRepository.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: TicketStatus.CANCELLED,
        ownerRoleAtChange: TICKET_OWNER_ROLE.DOCTOR,
        assignedUnitIdSnapshot: null,
        comment: 'Duplicate request',
      }),
    );
  });

  it('returns an ordered mixed history timeline for a visible ticket', async () => {
    const ticketRepository = createTicketRepositoryMock();
    const historyRepository = createHistoryRepositoryMock();
    const handoffRepository = createHandoffRepositoryMock();
    ticketRepository.findOne.mockResolvedValue({
      id: 'ticket-5',
      currentOwnerRole: TICKET_OWNER_ROLE.DOCTOR,
      assignedUnit: null,
    });
    historyRepository.find.mockResolvedValue([
      {
        id: 'status-early',
        status: TicketStatus.PENDING,
        createdAt: new Date('2026-01-01T09:00:00.000Z'),
      },
      {
        id: 'status-late',
        status: TicketStatus.ASSIGNED,
        createdAt: new Date('2026-01-01T09:30:00.000Z'),
      },
    ]);
    handoffRepository.find.mockResolvedValue([
      {
        id: 'handoff-mid',
        fromOwnerRole: TICKET_OWNER_ROLE.DISPATCHER,
        toOwnerRole: TICKET_OWNER_ROLE.DOCTOR,
        createdAt: new Date('2026-01-01T09:15:00.000Z'),
      },
    ]);

    const service = new TicketsService(
      ticketRepository as never,
      historyRepository as never,
      handoffRepository as never,
      createGatewayMock() as never,
      {} as never,
      createPolicyMock() as never,
    );

    const history = await service.getHistory('ticket-5', {
      id: 'doctor-2',
      role: UserRole.DOCTOR,
    } as never);

    expect(history.map((entry) => entry.id)).toEqual([
      'status-early',
      'handoff-mid',
      'status-late',
    ]);
    expect(history.map((entry) => entry.eventType)).toEqual([
      'status',
      'handoff',
      'status',
    ]);
  });
});
