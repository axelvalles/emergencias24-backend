import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserRole, UserStatus } from '../users/entities/user.entity';
import { TicketsGateway } from './tickets.gateway';
import { TICKET_OWNER_ROLE } from './ticket-owner-role';

type MockSocket = {
  id: string;
  handshake: { auth?: { token?: unknown }; headers: Record<string, unknown> };
  data: Record<string, unknown>;
  join: jest.Mock<Promise<void>, [string]>;
  leave: jest.Mock<Promise<void>, [string]>;
  disconnect: jest.Mock<void, [boolean]>;
};

type MockServerEmitter = {
  emit: jest.Mock<void, [string, Record<string, unknown>]>;
};

type MockServer = {
  to: jest.Mock;
};

describe('TicketsGateway auth and room authorization', () => {
  let jwtService: { verify: jest.Mock };
  let usersService: { findOne: jest.Mock };
  let gateway: TicketsGateway;

  const makeSocket = (): MockSocket => ({
    id: 'socket-1',
    handshake: { auth: {}, headers: {} },
    data: {},
    join: jest.fn().mockResolvedValue(undefined),
    leave: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
  });

  const makeServer = (): MockServer => ({
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
  });

  beforeEach(() => {
    jwtService = {
      verify: jest.fn(),
    };

    usersService = {
      findOne: jest.fn(),
    };

    gateway = new TicketsGateway(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
    );
    gateway.server = makeServer() as never;
  });

  it('disconnects on connection when JWT is missing', async () => {
    const socket = makeSocket();

    await gateway.handleConnection(socket as never);

    expect(socket.disconnect).toHaveBeenCalledWith(true);
    expect(socket.join).not.toHaveBeenCalled();
    expect(jwtService.verify).not.toHaveBeenCalled();
  });

  it('connects and joins default room when JWT and active user are valid', async () => {
    const socket = makeSocket();
    socket.handshake.auth = { token: 'jwt-token' };

    jwtService.verify.mockReturnValue({ sub: 'user-1' });
    usersService.findOne.mockResolvedValue({
      id: 'user-1',
      role: UserRole.DISPATCHER,
      email: 'dispatcher@example.com',
      status: UserStatus.ACTIVE,
      activeAmbulanceUnit: null,
    });

    await gateway.handleConnection(socket as never);

    expect(jwtService.verify).toHaveBeenCalledWith('jwt-token');
    expect(usersService.findOne).toHaveBeenCalledWith('user-1');
    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(socket.join).toHaveBeenCalledWith('tickets');
    expect(socket.data.user).toEqual({
      id: 'user-1',
      role: UserRole.DISPATCHER,
      email: 'dispatcher@example.com',
      activeAmbulanceUnitId: null,
    });
  });

  it('disconnects on connection when user is inactive', async () => {
    const socket = makeSocket();
    socket.handshake.auth = { token: 'jwt-token' };

    jwtService.verify.mockReturnValue({ sub: 'user-2' });
    usersService.findOne.mockResolvedValue({
      id: 'user-2',
      role: UserRole.ADMIN,
      email: 'admin@example.com',
      status: UserStatus.INACTIVE,
      activeAmbulanceUnit: null,
    });

    await gateway.handleConnection(socket as never);

    expect(socket.disconnect).toHaveBeenCalledWith(true);
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('disconnects room join when user role is unauthorized', () => {
    const socket = makeSocket();
    socket.data.user = { role: 'viewer' };

    const response = gateway.handleJoinTicketsRoom(socket as never);

    expect(socket.disconnect).toHaveBeenCalledWith(true);
    expect(socket.join).not.toHaveBeenCalled();
    expect(response).toBeUndefined();
  });

  it('allows room join for authorized role', () => {
    const socket = makeSocket();
    socket.data.user = { role: UserRole.ADMIN };

    const response = gateway.handleJoinTicketsRoom(socket as never);

    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(socket.join).toHaveBeenCalledWith('tickets');
    expect(response).toEqual({
      event: 'joined-tickets-room',
      data: 'Successfully joined tickets room',
    });
  });

  it('joins the active ambulance unit room for paramedic users', async () => {
    const socket = makeSocket();
    socket.handshake.auth = { token: 'jwt-token' };

    jwtService.verify.mockReturnValue({ sub: 'paramedic-1' });
    usersService.findOne.mockResolvedValue({
      id: 'paramedic-1',
      role: UserRole.PARAMEDIC,
      email: 'paramedic@example.com',
      status: UserStatus.ACTIVE,
      activeAmbulanceUnit: { id: 'unit-123' },
    });

    await gateway.handleConnection(socket as never);

    expect(socket.join).toHaveBeenCalledWith('tickets:role:paramedic');
    expect(socket.join).toHaveBeenCalledWith('tickets:ambulance-unit:unit-123');
  });

  it('joins the role room for doctor users', async () => {
    const socket = makeSocket();
    socket.handshake.auth = { token: 'jwt-token' };

    jwtService.verify.mockReturnValue({ sub: 'doctor-1' });
    usersService.findOne.mockResolvedValue({
      id: 'doctor-1',
      role: UserRole.DOCTOR,
      email: 'doctor@example.com',
      status: UserStatus.ACTIVE,
      activeAmbulanceUnit: null,
    });

    await gateway.handleConnection(socket as never);

    expect(socket.join).toHaveBeenCalledWith('tickets:role:doctor');
    expect(socket.join).not.toHaveBeenCalledWith('tickets');
  });

  it('emits ticket.created once to the destination role room', () => {
    const ticket = {
      id: 'ticket-role-1',
      currentOwnerRole: TICKET_OWNER_ROLE.APPOINTMENT_MANAGER,
      assignedUnit: null,
    };

    gateway.emitTicketCreated(ticket as never);

    expect(gateway.server.to).toHaveBeenCalledWith(
      'tickets:role:appointment_manager',
    );
    expect(gateway.server.to).toHaveBeenCalledWith('tickets');
  });

  it('fans out paramedic assignment events to role and unit rooms only once each', () => {
    const ticket = {
      id: 'ticket-role-2',
      currentOwnerRole: TICKET_OWNER_ROLE.PARAMEDIC,
      assignedUnit: { id: 'unit-55' },
    };

    gateway.emitTicketAssigned(ticket as never);

    expect(gateway.server.to).toHaveBeenCalledWith('tickets:role:paramedic');
    expect(gateway.server.to).toHaveBeenCalledWith(
      'tickets:ambulance-unit:unit-55',
    );
    expect(gateway.server.to).toHaveBeenCalledWith('tickets');
  });

  it('disconnects room leave when user is missing', () => {
    const socket = makeSocket();

    const response = gateway.handleLeaveTicketsRoom(socket as never);

    expect(socket.disconnect).toHaveBeenCalledWith(true);
    expect(socket.leave).not.toHaveBeenCalled();
    expect(response).toBeUndefined();
  });
});
