import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { CancelTicketDto } from './dto/cancell-ticket.dto';
import { UpdateNoteTicketDto } from './dto/update-note-ticket.dto';
import { ActionTicketDto } from './dto/action-ticket.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/entities/user.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.AMBULANCE)
  findAll(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    query: QueryTicketsDto,
    @GetUser() user: User,
  ) {
    return this.ticketsService.findAll(query, user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.AMBULANCE)
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.ticketsService.findOne(id, user);
  }

  @Get(':id/history')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.AMBULANCE)
  getHistory(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.ticketsService.getHistory(id, user);
  }

  @Get('get-by-reference-number/:referenceNumber')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.AMBULANCE)
  findByReferenceNumber(
    @Param('referenceNumber', ParseIntPipe) referenceNumber: number,
    @GetUser() user: User,
  ) {
    return this.ticketsService.findByReferenceNumber(referenceNumber, user);
  }

  @Patch(':id/assign/:ambulanceUnitId')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  assignTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ambulanceUnitId', ParseUUIDPipe) ambulanceUnitId: string,
    @GetUser() user: User,
    @Body() { comment }: ActionTicketDto,
  ) {
    return this.ticketsService.assignTicket(id, ambulanceUnitId, user, comment);
  }

  @Patch(':id/start')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.AMBULANCE)
  startTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() { comment }: ActionTicketDto,
  ) {
    return this.ticketsService.startTicket(id, user, comment);
  }

  @Patch(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.AMBULANCE)
  completeTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() { comment }: ActionTicketDto,
  ) {
    return this.ticketsService.completeTicket(id, user, comment);
  }

  @Patch(':id/update-note')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.AMBULANCE)
  updateNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { note }: UpdateNoteTicketDto,
    @GetUser() user: User,
  ) {
    return this.ticketsService.updateNote(id, note, user);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  cancelTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { comment }: CancelTicketDto,
    @GetUser() user: User,
  ) {
    return this.ticketsService.cancelTicket(id, user, comment);
  }
}
