import { BadRequestException } from '@nestjs/common';
import { TicketsService } from './tickets.service';

describe('TicketsService sorting', () => {
  function createQueryBuilderMock() {
    return {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
  }

  it('maps allowlisted sort field to safe ticket column', async () => {
    const qb = createQueryBuilderMock();
    const ticketRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    const historyRepository = {};
    const ticketsGateway = {};
    const usersService = {};
    const service = new TicketsService(
      ticketRepository as never,
      historyRepository as never,
      ticketsGateway as never,
      usersService as never,
    );

    await service.findAll({ sortBy: 'status', sortOrder: 'ASC' });

    expect(qb.orderBy).toHaveBeenCalledWith('ticket.status', 'ASC');
  });

  it('throws 400 for unknown sort fields', async () => {
    const qb = createQueryBuilderMock();
    const ticketRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    const historyRepository = {};
    const ticketsGateway = {};
    const usersService = {};
    const service = new TicketsService(
      ticketRepository as never,
      historyRepository as never,
      ticketsGateway as never,
      usersService as never,
    );

    await expect(
      service.findAll({ sortBy: 'unknownField' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
