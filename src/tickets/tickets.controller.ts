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
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { CancelTicketDto } from './dto/cancell-ticket.dto';
import { UpdateNoteTicketDto } from './dto/update-note-ticket.dto';

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

  @Get('reference/:referenceNumber')
  findByReferenceNumber(
    @Param('referenceNumber', ParseIntPipe) referenceNumber: number,
  ) {
    return this.ticketsService.findByReferenceNumber(referenceNumber);
  }

  @Patch(':id/assign/:assignedTo')
  assignTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('assignedTo') assignedTo: string,
  ) {
    return this.ticketsService.assignTicket(id, assignedTo);
  }

  @Patch(':id/complete')
  completeTicket(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.completeTicket(id);
  }

  @Patch(':id/update-note')
  updateNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { note }: UpdateNoteTicketDto,
  ) {
    return this.ticketsService.updateNote(id, note);
  }

  @Patch(':id/cancel')
  cancelTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { cancellationReason }: CancelTicketDto,
  ) {
    return this.ticketsService.cancelTicket(id, cancellationReason);
  }
}
