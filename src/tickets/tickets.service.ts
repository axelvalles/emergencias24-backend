import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { TicketsGateway } from './tickets.gateway';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly ticketsGateway: TicketsGateway,
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const ticket = this.ticketRepository.create(createTicketDto);
    const savedTicket = await this.ticketRepository.save(ticket);

    // Emitir evento WebSocket
    this.ticketsGateway.emitTicketCreated(savedTicket);

    return savedTicket;
  }

  async findByReferenceNumber(referenceNumber: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { referenceNumber },
      relations: ['patient'],
    });

    if (!ticket) {
      throw new NotFoundException(
        `Ticket with reference number ${referenceNumber} not found`,
      );
    }

    return ticket;
  }

  async findAll(queryDto: QueryTicketsDto = {}): Promise<{
    data: Ticket[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      ...filters
    } = queryDto;

    const queryBuilder = this.ticketRepository.createQueryBuilder('ticket');

    // Aplicar filtros
    this.applyFilters(queryBuilder, filters);

    // Aplicar ordenamiento
    queryBuilder.orderBy(`ticket.${sortBy}`, sortOrder);

    // Aplicar paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Incluir relaciones
    queryBuilder.leftJoinAndSelect('ticket.patient', 'patient');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['patient'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(id);

    // Actualizar campos de asignación si se está asignando
    if (updateTicketDto.assignedTo && !ticket.assignedTo) {
      updateTicketDto.assignedAt = new Date();
    }

    // Actualizar campos de completado si se está completando
    if (
      updateTicketDto.status === TicketStatus.COMPLETED &&
      ticket.status !== TicketStatus.COMPLETED
    ) {
      updateTicketDto.completedAt = new Date();
    }

    Object.assign(ticket, updateTicketDto);
    const updatedTicket = await this.ticketRepository.save(ticket);

    // Emitir eventos WebSocket según el cambio
    if (updateTicketDto.assignedTo && !ticket.assignedTo) {
      this.ticketsGateway.emitTicketAssigned(updatedTicket);
    } else if (updateTicketDto.status === TicketStatus.COMPLETED) {
      this.ticketsGateway.emitTicketCompleted(updatedTicket);
    } else if (updateTicketDto.status === TicketStatus.CANCELLED) {
      this.ticketsGateway.emitTicketCancelled(updatedTicket);
    } else {
      this.ticketsGateway.emitTicketUpdated(updatedTicket);
    }

    return updatedTicket;
  }

  async remove(id: string): Promise<void> {
    const ticket = await this.findOne(id);
    await this.ticketRepository.remove(ticket);
  }

  async assignTicket(id: string, assignedTo: string): Promise<Ticket> {
    return this.update(id, {
      assignedTo,
      status: TicketStatus.ASSIGNED,
    });
  }

  async completeTicket(id: string): Promise<Ticket> {
    return this.update(id, {
      status: TicketStatus.COMPLETED,
    });
  }

  async cancelTicket(id: string): Promise<Ticket> {
    return this.update(id, {
      status: TicketStatus.CANCELLED,
    });
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Ticket>,
    filters: Partial<QueryTicketsDto>,
  ): void {
    if (filters.serviceType && filters.serviceType.length > 0) {
      queryBuilder.andWhere('ticket.serviceType IN (:...serviceType)', {
        serviceType: filters.serviceType,
      });
    }

    if (filters.status && filters.status.length > 0) {
      queryBuilder.andWhere('ticket.status IN (:...status)', {
        status: filters.status,
      });
    }

    if (filters.priority) {
      queryBuilder.andWhere('ticket.priority = :priority', {
        priority: filters.priority,
      });
    }

    if (filters.requesterPhone) {
      queryBuilder.andWhere('ticket.requesterPhone LIKE :requesterPhone', {
        requesterPhone: `%${filters.requesterPhone}%`,
      });
    }

    if (filters.municipality) {
      queryBuilder.andWhere('ticket.municipality LIKE :municipality', {
        municipality: `%${filters.municipality}%`,
      });
    }

    if (filters.assignedTo) {
      queryBuilder.andWhere('ticket.assignedTo = :assignedTo', {
        assignedTo: filters.assignedTo,
      });
    }

    if (filters.referenceNumber) {
      queryBuilder.andWhere('ticket.referenceNumber = :referenceNumber', {
        referenceNumber: filters.referenceNumber,
      });
    }

    if (filters.createdFrom) {
      queryBuilder.andWhere('ticket.createdAt >= :createdFrom', {
        createdFrom: filters.createdFrom,
      });
    }

    if (filters.createdTo) {
      queryBuilder.andWhere('ticket.createdAt <= :createdTo', {
        createdTo: filters.createdTo,
      });
    }
  }
}
