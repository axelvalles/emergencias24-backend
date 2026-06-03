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
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  findAll(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    query: QueryTicketsDto,
  ) {
    return this.ticketsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.findOne(id);
  }

  @Get(':id/history')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  getHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.getHistory(id);
  }

  @Get('get-by-reference-number/:referenceNumber')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  findByReferenceNumber(
    @Param('referenceNumber', ParseIntPipe) referenceNumber: number,
  ) {
    return this.ticketsService.findByReferenceNumber(referenceNumber);
  }

  @Patch(':id/assign/:assignedTo')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  assignTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('assignedTo') assignedTo: string,
    @GetUser() user: User,
    @Body() { comment }: ActionTicketDto,
  ) {
    return this.ticketsService.assignTicket(id, assignedTo, user, comment);
  }

  @Patch(':id/start')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  startTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() { comment }: ActionTicketDto,
  ) {
    return this.ticketsService.startTicket(id, user, comment);
  }

  @Patch(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  completeTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() { comment }: ActionTicketDto,
  ) {
    return this.ticketsService.completeTicket(id, user, comment);
  }

  @Patch(':id/update-note')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  updateNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { note }: UpdateNoteTicketDto,
  ) {
    return this.ticketsService.updateNote(id, note);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  cancelTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { comment }: CancelTicketDto,
    @GetUser() user: User,
  ) {
    return this.ticketsService.cancelTicket(id, user, comment);
  }
}
