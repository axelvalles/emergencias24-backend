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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { User } from 'src/users/entities/user.entity';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
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
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.findOne(id);
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard)
  getHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.getHistory(id);
  }

  @Get('get-by-reference-number/:referenceNumber')
  findByReferenceNumber(
    @Param('referenceNumber', ParseIntPipe) referenceNumber: number,
  ) {
    return this.ticketsService.findByReferenceNumber(referenceNumber);
  }

  @Patch(':id/assign/:assignedTo')
  @UseGuards(JwtAuthGuard)
  assignTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('assignedTo') assignedTo: string,
    @GetUser() user: User,
  ) {
    return this.ticketsService.assignTicket(id, assignedTo, user);
  }

  @Patch(':id/start')
  @UseGuards(JwtAuthGuard)
  startTicket(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.ticketsService.startTicket(id, user);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  completeTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    return this.ticketsService.completeTicket(id, user);
  }

  @Patch(':id/update-note')
  updateNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { note }: UpdateNoteTicketDto,
  ) {
    return this.ticketsService.updateNote(id, note);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancelTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { cancellationReason }: CancelTicketDto,
    @GetUser() user: User,
  ) {
    return this.ticketsService.cancelTicket(id, cancellationReason, user);
  }
}
