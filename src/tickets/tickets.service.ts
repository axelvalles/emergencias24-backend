import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { TicketsGateway } from './tickets.gateway';
import { UsersService } from '../users/users.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly ticketsGateway: TicketsGateway,
    private readonly usersService: UsersService,
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

  async remove(id: string): Promise<void> {
    const ticket = await this.findOne(id);
    await this.ticketRepository.remove(ticket);
  }

  async assignTicket(id: string, assignedTo: string): Promise<Ticket> {
    const ticket = await this.findOne(id);
    const user = await this.usersService.findOne(assignedTo);

    if (!user) {
      throw new NotFoundException(`User with ID ${assignedTo} not found`);
    }

    ticket.assignedUser = user;
    ticket.assignedAt = new Date();
    ticket.status = TicketStatus.ASSIGNED;

    await this.ticketRepository.save(ticket);

    return ticket;
  }

  async completeTicket(id: string): Promise<Ticket> {
    const ticket = await this.findOne(id);

    ticket.status = TicketStatus.COMPLETED;
    ticket.completedAt = new Date();

    await this.ticketRepository.save(ticket);

    return ticket;
  }

  async updateNote(id: string, note: string): Promise<Ticket> {
    const ticket = await this.findOne(id);

    ticket.note = note;

    await this.ticketRepository.save(ticket);

    return ticket;
  }

  async cancelTicket(id: string, cancellationReason: string): Promise<Ticket> {
    const ticket = await this.findOne(id);

    ticket.cancellationReason = cancellationReason;
    ticket.status = TicketStatus.CANCELLED;

    await this.ticketRepository.save(ticket);

    return ticket;
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
      queryBuilder.andWhere('ticket.assignedUser = :assignedTo', {
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
