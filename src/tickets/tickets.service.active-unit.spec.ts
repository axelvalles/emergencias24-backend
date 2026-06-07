import { ForbiddenException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { UserRole } from 'src/users/entities/user.entity';

describe('TicketsService active ambulance unit access', () => {
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

  it('returns no ticket rows for ambulance users without memberships', async () => {
    const qb = createQueryBuilderMock();
    const ticketRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const service = new TicketsService(
      ticketRepository as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await service.findAll({}, {
      id: 'ambulance-1',
      role: UserRole.AMBULANCE,
      ambulanceUnits: [],
      activeAmbulanceUnit: null,
    } as never);

    expect(qb.andWhere).toHaveBeenCalledWith('1 = 0');
  });

  it('requires an active ambulance unit when user has multiple memberships', async () => {
    const qb = createQueryBuilderMock();
    const ticketRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const service = new TicketsService(
      ticketRepository as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.findAll({}, {
        id: 'ambulance-2',
        role: UserRole.AMBULANCE,
        ambulanceUnits: [{ id: 'unit-1' }, { id: 'unit-2' }],
        activeAmbulanceUnit: null,
      } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
