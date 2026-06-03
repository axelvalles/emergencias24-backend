import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { TicketStatusHistory } from './entities/ticket-status-history.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { TicketsGateway } from './tickets.gateway';
import { UsersService } from '../users/users.service';
import { User } from 'src/users/entities/user.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { applyGlobalSearch } from '../common/query/apply-global-search';

const TICKET_SORT_COLUMN_MAP: Record<string, string> = {
  createdAt: 'ticket.createdAt',
  updatedAt: 'ticket.updatedAt',
  referenceNumber: 'ticket.referenceNumber',
  status: 'ticket.status',
  priority: 'ticket.priority',
};

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketStatusHistory)
    private readonly historyRepository: Repository<TicketStatusHistory>,
    private readonly ticketsGateway: TicketsGateway,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateTicketDto, patient?: Patient): Promise<Ticket> {
    const ticket = this.ticketRepository.create({ ...dto, patient });

    const savedTicket = await this.ticketRepository.save(ticket);

    // Registrar historial inicial
    await this.createHistory(savedTicket, TicketStatus.PENDING);

    // Emitir evento WebSocket
    this.ticketsGateway.emitTicketCreated(savedTicket);

    return savedTicket;
  }

  async findByReferenceNumber(referenceNumber: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { referenceNumber },
      relations: ['patient', 'assignedUser'],
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

    // Incluir relaciones antes de filtrar para habilitar búsqueda global en patient
    queryBuilder.leftJoinAndSelect('ticket.patient', 'patient');

    // Aplicar filtros
    this.applyFilters(queryBuilder, filters);

    // Aplicar ordenamiento
    const sortColumn = this.getTicketSortColumn(sortBy);
    queryBuilder.orderBy(sortColumn, sortOrder);

    // Aplicar paginación
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

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
      relations: ['patient', 'assignedUser'],
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

  async assignTicket(
    id: string,
    assignedTo: string,
    changedBy?: User,
    comment?: string,
  ): Promise<Ticket> {
    const ticket = await this.findOne(id);
    const user = await this.usersService.findOne(assignedTo);

    if (!user) {
      throw new NotFoundException(`User with ID ${assignedTo} not found`);
    }

    ticket.assignedUser = user;
    ticket.assignedAt = new Date();
    ticket.status = TicketStatus.ASSIGNED;

    const savedTicket = await this.ticketRepository.save(ticket);

    await this.createHistory(
      savedTicket,
      TicketStatus.ASSIGNED,
      changedBy,
      comment,
    );

    return savedTicket;
  }

  async startTicket(id: string, user: User, comment?: string): Promise<Ticket> {
    const ticket = await this.findOne(id);

    if (ticket.status !== TicketStatus.ASSIGNED) {
      throw new BadRequestException('Only assigned tickets can be started');
    }

    ticket.status = TicketStatus.IN_PROGRESS;

    const savedTicket = await this.ticketRepository.save(ticket);

    await this.createHistory(
      savedTicket,
      TicketStatus.IN_PROGRESS,
      user,
      comment,
    );

    return savedTicket;
  }

  async completeTicket(
    id: string,
    changedBy?: User,
    comment?: string,
  ): Promise<Ticket> {
    const ticket = await this.findOne(id);

    ticket.status = TicketStatus.COMPLETED;
    ticket.completedAt = new Date();

    const savedTicket = await this.ticketRepository.save(ticket);

    await this.createHistory(
      savedTicket,
      TicketStatus.COMPLETED,
      changedBy,
      comment,
    );

    return savedTicket;
  }

  async updateNote(id: string, note: string): Promise<Ticket> {
    const ticket = await this.findOne(id);

    ticket.note = note;

    await this.ticketRepository.save(ticket);

    return ticket;
  }

  async cancelTicket(
    id: string,
    changedBy?: User,
    comment?: string,
  ): Promise<Ticket> {
    const ticket = await this.findOne(id);

    ticket.status = TicketStatus.CANCELLED;

    const savedTicket = await this.ticketRepository.save(ticket);

    await this.createHistory(
      savedTicket,
      TicketStatus.CANCELLED,
      changedBy,
      comment,
    );

    return savedTicket;
  }

  async getHistory(id: string): Promise<TicketStatusHistory[]> {
    await this.findOne(id);

    return this.historyRepository.find({
      where: { ticket: { id } },
      relations: ['changedBy'],
      order: { createdAt: 'ASC' },
    });
  }

  private async createHistory(
    ticket: Ticket,
    status: TicketStatus,
    changedBy?: User,
    comment?: string,
  ): Promise<void> {
    const history = this.historyRepository.create({
      ticket,
      status,
      changedBy,
      comment,
    });
    await this.historyRepository.save(history);
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Ticket>,
    filters: Partial<QueryTicketsDto>,
  ): void {
    applyGlobalSearch(queryBuilder, {
      query: filters.q,
      expressions: [
        'ticket.requesterName',
        'ticket.requesterPhone',
        'ticket.municipality',
        'ticket.location',
        'CAST(ticket.referenceNumber AS TEXT)',
        'patient.firstName',
        'patient.lastName',
        "CONCAT(patient.firstName, ' ', patient.lastName)",
        'patient.documentNumber',
      ],
      paramName: 'ticketSearch',
    });

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

  private getTicketSortColumn(sortBy?: string): string {
    if (!sortBy) {
      return TICKET_SORT_COLUMN_MAP.createdAt;
    }

    const sortColumn = TICKET_SORT_COLUMN_MAP[sortBy];

    if (!sortColumn) {
      throw new BadRequestException(
        `Invalid sortBy value. Allowed values: ${Object.keys(TICKET_SORT_COLUMN_MAP).join(', ')}`,
      );
    }

    return sortColumn;
  }
}
