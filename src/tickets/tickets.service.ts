import {
  BadRequestException,
  ForbiddenException,
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
import { User, UserRole } from 'src/users/entities/user.entity';
import { Patient } from 'src/patients/entities/patient.entity';
import { applyGlobalSearch } from '../common/query/apply-global-search';
import { AmbulanceUnitsService } from 'src/ambulance-units/ambulance-units.service';
import { AmbulanceUnit } from 'src/ambulance-units/entities/ambulance-unit.entity';

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
    private readonly ambulanceUnitsService: AmbulanceUnitsService,
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

  async findByReferenceNumber(
    referenceNumber: number,
    user?: User,
  ): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { referenceNumber },
      relations: ['patient', 'assignedUnit'],
    });

    if (!ticket) {
      throw new NotFoundException(
        `Ticket with reference number ${referenceNumber} not found`,
      );
    }

    this.assertCanAccessTicket(ticket, user);

    return ticket;
  }

  async findAll(queryDto: QueryTicketsDto = {}, user?: User): Promise<{
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
    this.applyFilters(queryBuilder, filters, user);

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

  async findOne(id: string, user?: User): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['patient', 'assignedUnit'],
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    this.assertCanAccessTicket(ticket, user);

    return ticket;
  }

  async remove(id: string): Promise<void> {
    const ticket = await this.findOne(id);
    await this.ticketRepository.remove(ticket);
  }

  async assignTicket(
    id: string,
    ambulanceUnitId: string,
    changedBy?: User,
    comment?: string,
  ): Promise<Ticket> {
    const ticket = await this.findOne(id);
    const ambulanceUnit = await this.ambulanceUnitsService.findOne(
      ambulanceUnitId,
    );

    if (ambulanceUnit.members.length === 0) {
      throw new BadRequestException(
        'Tickets can only be assigned to ambulance units with at least one member',
      );
    }

    ticket.assignedUnit = ambulanceUnit;
    ticket.assignedAt = new Date();
    ticket.status = TicketStatus.ASSIGNED;

    const savedTicket = await this.ticketRepository.save(ticket);

    this.ticketsGateway.emitTicketUpdated(savedTicket);
    this.ticketsGateway.emitTicketAssigned(savedTicket);

    await this.createHistory(
      savedTicket,
      TicketStatus.ASSIGNED,
      changedBy,
      comment,
    );

    return savedTicket;
  }

  async startTicket(id: string, user: User, comment?: string): Promise<Ticket> {
    const ticket = await this.findOne(id, user);

    if (ticket.status !== TicketStatus.ASSIGNED) {
      throw new BadRequestException('Only assigned tickets can be started');
    }

    ticket.status = TicketStatus.IN_PROGRESS;

    const savedTicket = await this.ticketRepository.save(ticket);

    this.ticketsGateway.emitTicketUpdated(savedTicket);

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
    const ticket = await this.findOne(id, changedBy);

    ticket.status = TicketStatus.COMPLETED;
    ticket.completedAt = new Date();

    const savedTicket = await this.ticketRepository.save(ticket);

    this.ticketsGateway.emitTicketUpdated(savedTicket);
    this.ticketsGateway.emitTicketCompleted(savedTicket);

    await this.createHistory(
      savedTicket,
      TicketStatus.COMPLETED,
      changedBy,
      comment,
    );

    return savedTicket;
  }

  async updateNote(id: string, note: string, user?: User): Promise<Ticket> {
    const ticket = await this.findOne(id, user);

    ticket.note = note;

    await this.ticketRepository.save(ticket);

    this.ticketsGateway.emitTicketUpdated(ticket);

    return ticket;
  }

  async cancelTicket(
    id: string,
    changedBy?: User,
    comment?: string,
  ): Promise<Ticket> {
    const ticket = await this.findOne(id, changedBy);

    ticket.status = TicketStatus.CANCELLED;

    const savedTicket = await this.ticketRepository.save(ticket);

    this.ticketsGateway.emitTicketUpdated(savedTicket);
    this.ticketsGateway.emitTicketCancelled(savedTicket);

    await this.createHistory(
      savedTicket,
      TicketStatus.CANCELLED,
      changedBy,
      comment,
    );

    return savedTicket;
  }

  async getHistory(id: string, user?: User): Promise<TicketStatusHistory[]> {
    await this.findOne(id, user);

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
    user?: User,
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

    if (filters.assignedUnitId) {
      queryBuilder.andWhere('ticket.assignedUnit = :assignedUnitId', {
        assignedUnitId: filters.assignedUnitId,
      });
    }

    if (user?.role === UserRole.AMBULANCE) {
      if ((user.ambulanceUnits ?? []).length === 0) {
        queryBuilder.andWhere('1 = 0');
        return;
      }

      const activeUnit = this.getRequiredActiveUnit(user);

      queryBuilder.andWhere('ticket.assignedUnit = :activeAmbulanceUnitId', {
        activeAmbulanceUnitId: activeUnit.id,
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

  private assertCanAccessTicket(ticket: Ticket, user?: User): void {
    if (!user || user.role !== UserRole.AMBULANCE) {
      return;
    }

    const activeUnit = this.getRequiredActiveUnit(user);

    if (ticket.assignedUnit?.id !== activeUnit.id) {
      throw new ForbiddenException(
        'Ambulance users can only access tickets assigned to their active unit',
      );
    }
  }

  private getRequiredActiveUnit(user: User): AmbulanceUnit {
    const ambulanceUnits = user.ambulanceUnits ?? [];

    if (ambulanceUnits.length === 1) {
      return ambulanceUnits[0];
    }

    if (!user.activeAmbulanceUnit) {
      throw new ForbiddenException(
        'Ambulance users must select an active ambulance unit first',
      );
    }

    const belongsToActiveUnit = ambulanceUnits.some(
      (unit) => unit.id === user.activeAmbulanceUnit?.id,
    );

    if (!belongsToActiveUnit) {
      throw new ForbiddenException(
        'The active ambulance unit is no longer assigned to the authenticated user',
      );
    }

    return user.activeAmbulanceUnit;
  }
}
