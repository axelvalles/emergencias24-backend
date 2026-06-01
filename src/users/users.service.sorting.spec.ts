import { BadRequestException } from '@nestjs/common';

import { UsersService } from './users.service';

describe('UsersService sorting', () => {
  function createQueryBuilderMock() {
    return {
      andWhere: jest.fn().mockReturnThis(),

      addOrderBy: jest.fn().mockReturnThis(),

      skip: jest.fn().mockReturnThis(),

      take: jest.fn().mockReturnThis(),

      select: jest.fn().mockReturnThis(),

      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
  }

  it('sorts by fullName with firstName+lastName mapping', async () => {
    const qb = createQueryBuilderMock();

    const userRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const service = new UsersService(userRepository as never);

    await service.findAll({ sortBy: 'fullName', sortOrder: 'DESC' });

    expect(qb.addOrderBy).toHaveBeenNthCalledWith(1, 'user.firstName', 'DESC');

    expect(qb.addOrderBy).toHaveBeenNthCalledWith(2, 'user.lastName', 'DESC');
  });

  it('throws 400 for unknown sort fields', async () => {
    const qb = createQueryBuilderMock();

    const userRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const service = new UsersService(userRepository as never);

    await expect(
      service.findAll({ sortBy: 'unknownField' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
