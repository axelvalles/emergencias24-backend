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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/tickets', // 👈 Namespace dedicado para los eventos de tickets
})
@Injectable()
export class TicketsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TicketsGateway.name);

  afterInit() {
    this.logger.log('✅ Tickets WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`🟢 Client connected: ${client.id}`);

    // Por defecto, unimos al cliente a la sala "tickets"
    // para que reciba los broadcasts generales
    void client.join('tickets');
    this.logger.log(`Client ${client.id} joined default room "tickets"`);
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
    void client.join('tickets');
    this.logger.log(`Client ${client.id} joined tickets room`);
    return {
      event: 'joined-tickets-room',
      data: 'Successfully joined tickets room',
    };
  }

  @SubscribeMessage('leave-tickets-room')
  handleLeaveTicketsRoom(client: Socket) {
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
    this.logger.log(`♻️ Ticket updated event emitted for ticket ${ticket.id}`);
  }

  emitTicketAssigned(ticket: Ticket) {
    this.server.to('tickets').emit('ticket.assigned', {
      ticket,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`👤 Ticket assigned event emitted for ticket ${ticket.id}`);
  }

  emitTicketCompleted(ticket: Ticket) {
    this.server.to('tickets').emit('ticket.completed', {
      ticket,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(
      `✅ Ticket completed event emitted for ticket ${ticket.id}`,
    );
  }

  emitTicketCancelled(ticket: Ticket) {
    this.server.to('tickets').emit('ticket.cancelled', {
      ticket,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(
      `🚫 Ticket cancelled event emitted for ticket ${ticket.id}`,
    );
  }
}
