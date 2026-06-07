import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { Injectable, Logger } from '@nestjs/common';

import { Ticket } from './entities/ticket.entity';

import { UsersService } from '../users/users.service';

import { UserRole, UserStatus } from '../users/entities/user.entity';

import { JwtService } from '@nestjs/jwt';

import { parseCorsOrigins } from '../config/cors';

@WebSocketGateway({
  namespace: '/tickets', // 👈 Namespace dedicado para los eventos de tickets
})
@Injectable()
export class TicketsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private static readonly ALLOWED_ROLES = new Set<UserRole>([
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.DISPATCHER,
    UserRole.AMBULANCE,
  ]);

  constructor(
    private readonly usersService: UsersService,

    private readonly jwtService: JwtService,
  ) {}

  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TicketsGateway.name);

  private static getAuthenticatedUser(
    client: Socket,
  ): { id?: string; role?: UserRole; activeAmbulanceUnitId?: string | null } | undefined {
    const data = client.data as Record<string, unknown>;

    return data['user'] as
      | { id?: string; role?: UserRole; activeAmbulanceUnitId?: string | null }
      | undefined;
  }

  private static getAmbulanceUnitRoom(ambulanceUnitId: string): string {
    return `tickets:ambulance-unit:${ambulanceUnitId}`;
  }

  afterInit() {
    const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);

    if (process.env.NODE_ENV === 'production' && corsOrigins.length === 0) {
      throw new Error(
        'CORS_ORIGINS must be set in production for WebSocket. No fallback allowed.',
      );
    }

    if (this.server?.engine?.opts) {
      this.server.engine.opts.cors = {
        origin: corsOrigins.length > 0 ? corsOrigins : true,
      };
    }

    this.logger.log('✅ Tickets WebSocket Gateway initialized');
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;

    if (typeof authToken === 'string' && authToken.trim().length > 0) {
      return authToken;
    }

    const headerAuth = client.handshake.headers.authorization;

    if (typeof headerAuth === 'string' && headerAuth.startsWith('Bearer ')) {
      return headerAuth.slice('Bearer '.length).trim();
    }

    return null;
  }

  private async authenticateClient(client: Socket) {
    const token = this.extractToken(client);

    if (!token) {
      throw new Error('Missing WebSocket auth token');
    }

    const payload = this.jwtService.verify<{ sub?: string }>(token);

    if (!payload?.sub) {
      throw new Error('Invalid token payload');
    }

    const user = await this.usersService.findOne(payload.sub);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new Error('Unauthorized user');
    }

    if (!TicketsGateway.ALLOWED_ROLES.has(user.role)) {
      throw new Error('Forbidden role');
    }

    const data = client.data as Record<string, unknown>;

    data.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      activeAmbulanceUnitId: user.activeAmbulanceUnit?.id ?? null,
    };
  }

  async handleConnection(client: Socket) {
    try {
      await this.authenticateClient(client);
    } catch (error) {
      this.logger.warn(
        `🔒 Unauthorized tickets socket connection rejected (${client.id}): ${(error as Error).message}`,
      );

      client.disconnect(true);

      return;
    }

    this.logger.log(`🟢 Client connected: ${client.id}`);
    const user = TicketsGateway.getAuthenticatedUser(client);

    if (user?.role === UserRole.AMBULANCE) {
      if (user.activeAmbulanceUnitId) {
        void client.join(
          TicketsGateway.getAmbulanceUnitRoom(user.activeAmbulanceUnitId),
        );
        this.logger.log(
          `Client ${client.id} joined ambulance unit room ${user.activeAmbulanceUnitId}`,
        );
      }

      return;
    }

    void client.join('tickets');

    this.logger.log(`Client ${client.id} joined default room "tickets"`);
  }

  private isAuthorizedUser(client: Socket): boolean {
    const user = TicketsGateway.getAuthenticatedUser(client);

    if (!user?.role) {
      return false;
    }

    return TicketsGateway.ALLOWED_ROLES.has(user.role);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔴 Client disconnected: ${client.id}`);
  }

  /**



   * 👇 Métodos que permiten a los clientes unirse o salir manualmente



   *    de la sala 'tickets', si lo deseas manejar de forma explícita.



   */

  @SubscribeMessage('join-tickets-room')
  handleJoinTicketsRoom(client: Socket) {
    if (!this.isAuthorizedUser(client)) {
      client.disconnect(true);

      return;
    }

    const user = TicketsGateway.getAuthenticatedUser(client);

    if (user?.role === UserRole.AMBULANCE) {
      if (user.activeAmbulanceUnitId) {
        void client.join(
          TicketsGateway.getAmbulanceUnitRoom(user.activeAmbulanceUnitId),
        );

        this.logger.log(
          `Client ${client.id} joined ambulance unit room ${user.activeAmbulanceUnitId}`,
        );
      }

      return {
        event: 'joined-tickets-room',

        data: 'Successfully joined tickets room',
      };
    }

    void client.join('tickets');

    this.logger.log(`Client ${client.id} joined tickets room`);

    return {
      event: 'joined-tickets-room',

      data: 'Successfully joined tickets room',
    };
  }

  @SubscribeMessage('leave-tickets-room')
  handleLeaveTicketsRoom(client: Socket) {
    if (!this.isAuthorizedUser(client)) {
      client.disconnect(true);

      return;
    }

    const user = TicketsGateway.getAuthenticatedUser(client);

    if (user?.role === UserRole.AMBULANCE) {
      if (user.activeAmbulanceUnitId) {
        void client.leave(
          TicketsGateway.getAmbulanceUnitRoom(user.activeAmbulanceUnitId),
        );

        this.logger.log(
          `Client ${client.id} left ambulance unit room ${user.activeAmbulanceUnitId}`,
        );
      }

      return {
        event: 'left-tickets-room',

        data: 'Successfully left tickets room',
      };
    }

    void client.leave('tickets');

    this.logger.log(`Client ${client.id} left tickets room`);

    return {
      event: 'left-tickets-room',

      data: 'Successfully left tickets room',
    };
  }

  // ✅ Método para emitir evento cuando se crea un ticket

  emitTicketCreated(ticket: Ticket) {
    this.server.to('tickets').emit('ticket.created', {
      ticket,

      timestamp: new Date().toISOString(),
    });

    this.logger.log(`🎟️ Ticket created event emitted for ticket ${ticket.id}`);
  }

  emitTicketUpdated(ticket: Ticket) {
    this.server.to('tickets').emit('ticket.updated', {
      ticket,

      timestamp: new Date().toISOString(),
    });

    const assignedUnitId = ticket.assignedUnit?.id;

    if (assignedUnitId) {
      this.server
        .to(TicketsGateway.getAmbulanceUnitRoom(assignedUnitId))
        .emit('ticket.updated', {
          ticket,

          timestamp: new Date().toISOString(),
        });
    }

    this.logger.log(`♻️ Ticket updated event emitted for ticket ${ticket.id}`);
  }

  emitTicketAssigned(ticket: Ticket) {
    this.server.to('tickets').emit('ticket.assigned', {
      ticket,

      timestamp: new Date().toISOString(),
    });

    const assignedUnitId = ticket.assignedUnit?.id;

    if (assignedUnitId) {
      this.server
        .to(TicketsGateway.getAmbulanceUnitRoom(assignedUnitId))
        .emit('ticket.assigned', {
          ticket,

          timestamp: new Date().toISOString(),
        });
    }

    this.logger.log(`👤 Ticket assigned event emitted for ticket ${ticket.id}`);
  }

  emitTicketCompleted(ticket: Ticket) {
    this.server.to('tickets').emit('ticket.completed', {
      ticket,

      timestamp: new Date().toISOString(),
    });

    const assignedUnitId = ticket.assignedUnit?.id;

    if (assignedUnitId) {
      this.server
        .to(TicketsGateway.getAmbulanceUnitRoom(assignedUnitId))
        .emit('ticket.completed', {
          ticket,
          timestamp: new Date().toISOString(),
        });
    }

    this.logger.log(
      `✅ Ticket completed event emitted for ticket ${ticket.id}`,
    );
  }

  emitTicketCancelled(ticket: Ticket) {
    this.server.to('tickets').emit('ticket.cancelled', {
      ticket,

      timestamp: new Date().toISOString(),
    });

    const assignedUnitId = ticket.assignedUnit?.id;

    if (assignedUnitId) {
      this.server
        .to(TicketsGateway.getAmbulanceUnitRoom(assignedUnitId))
        .emit('ticket.cancelled', {
          ticket,
          timestamp: new Date().toISOString(),
        });
    }

    this.logger.log(
      `🚫 Ticket cancelled event emitted for ticket ${ticket.id}`,
    );
  }
}
