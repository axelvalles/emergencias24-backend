import { BadRequestException } from '@nestjs/common';
import { PatientsService } from './patients.service';

describe('PatientsService sorting', () => {
  function createQueryBuilderMock() {
    return {
      andWhere: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
  }

  it('sorts by fullName with firstName+lastName mapping', async () => {
    const qb = createQueryBuilderMock();
    const patientRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    const companyRepository = {};
    const service = new PatientsService(
      patientRepository as never,
      companyRepository as never,
    );

    await service.findAll({ sortBy: 'fullName', sortOrder: 'ASC' });

    expect(qb.addOrderBy).toHaveBeenNthCalledWith(
      1,
      'patient.firstName',
      'ASC',
    );
    expect(qb.addOrderBy).toHaveBeenNthCalledWith(2, 'patient.lastName', 'ASC');
  });

  it('throws 400 for unknown sort fields', async () => {
    const qb = createQueryBuilderMock();
    const patientRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };
    const companyRepository = {};
    const service = new PatientsService(
      patientRepository as never,
      companyRepository as never,
    );

    await expect(
      service.findAll({ sortBy: 'unknownField' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
