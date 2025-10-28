import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';

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

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.remove(id);
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

  @Patch(':id/cancel')
  cancelTicket(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.cancelTicket(id);
  }
}
