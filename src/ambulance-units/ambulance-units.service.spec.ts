import { ConflictException, NotFoundException } from '@nestjs/common';
import { AmbulanceUnitsService } from './ambulance-units.service';

describe('AmbulanceUnitsService', () => {
  function createQueryBuilderMock() {
    return {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
  }

  function createAmbulanceUnitRepositoryMock() {
    return {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
  }

  function createUserRepositoryMock() {
    return {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      save: jest.fn(),
    };
  }

  describe('findAll', () => {
    it('returns paginated response with correct shape', async () => {
      const mockUnits = [
        { id: '1', name: 'Unit A', members: [] },
        { id: '2', name: 'Unit B', members: [] },
      ];
      const qb = createQueryBuilderMock();
      qb.getManyAndCount.mockResolvedValue([mockUnits, 2]);

      const ambulanceUnitRepository = createAmbulanceUnitRepositoryMock();
      ambulanceUnitRepository.createQueryBuilder.mockReturnValue(qb);

      const userRepository = createUserRepositoryMock();
      const service = new AmbulanceUnitsService(
        ambulanceUnitRepository as never,
        userRepository as never,
      );

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: mockUnits,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('applies search filter when q is provided', async () => {
      const qb = createQueryBuilderMock();
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      const ambulanceUnitRepository = createAmbulanceUnitRepositoryMock();
      ambulanceUnitRepository.createQueryBuilder.mockReturnValue(qb);

      const userRepository = createUserRepositoryMock();
      const service = new AmbulanceUnitsService(
        ambulanceUnitRepository as never,
        userRepository as never,
      );

      await service.findAll({ q: 'ambulance' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'LOWER(ambulanceUnit.name) LIKE :name',
        { name: '%ambulance%' },
      );
    });

    it('applies sort by name ASC by default', async () => {
      const qb = createQueryBuilderMock();
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      const ambulanceUnitRepository = createAmbulanceUnitRepositoryMock();
      ambulanceUnitRepository.createQueryBuilder.mockReturnValue(qb);

      const userRepository = createUserRepositoryMock();
      const service = new AmbulanceUnitsService(
        ambulanceUnitRepository as never,
        userRepository as never,
      );

      await service.findAll({});

      expect(qb.addOrderBy).toHaveBeenCalledWith('ambulanceUnit.name', 'ASC');
    });

    it('applies sort by createdAt DESC when specified', async () => {
      const qb = createQueryBuilderMock();
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      const ambulanceUnitRepository = createAmbulanceUnitRepositoryMock();
      ambulanceUnitRepository.createQueryBuilder.mockReturnValue(qb);

      const userRepository = createUserRepositoryMock();
      const service = new AmbulanceUnitsService(
        ambulanceUnitRepository as never,
        userRepository as never,
      );

      await service.findAll({ sortBy: 'createdAt', sortOrder: 'DESC' });

      expect(qb.addOrderBy).toHaveBeenCalledWith('ambulanceUnit.createdAt', 'DESC');
    });

    it('calculates pagination correctly', async () => {
      const qb = createQueryBuilderMock();
      qb.getManyAndCount.mockResolvedValue([[], 50]);

      const ambulanceUnitRepository = createAmbulanceUnitRepositoryMock();
      ambulanceUnitRepository.createQueryBuilder.mockReturnValue(qb);

      const userRepository = createUserRepositoryMock();
      const service = new AmbulanceUnitsService(
        ambulanceUnitRepository as never,
        userRepository as never,
      );

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(result.totalPages).toBe(5);
      expect(qb.skip).toHaveBeenCalledWith(20);
      expect(qb.take).toHaveBeenCalledWith(10);
    });

    it('sanitizes limit to maximum of 100', async () => {
      const qb = createQueryBuilderMock();
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      const ambulanceUnitRepository = createAmbulanceUnitRepositoryMock();
      ambulanceUnitRepository.createQueryBuilder.mockReturnValue(qb);

      const userRepository = createUserRepositoryMock();
      const service = new AmbulanceUnitsService(
        ambulanceUnitRepository as never,
        userRepository as never,
      );

      const result = await service.findAll({ limit: 500 });

      expect(result.limit).toBe(100);
      expect(qb.take).toHaveBeenCalledWith(100);
    });

    it('sanitizes page to minimum of 1', async () => {
      const qb = createQueryBuilderMock();
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      const ambulanceUnitRepository = createAmbulanceUnitRepositoryMock();
      ambulanceUnitRepository.createQueryBuilder.mockReturnValue(qb);

      const userRepository = createUserRepositoryMock();
      const service = new AmbulanceUnitsService(
        ambulanceUnitRepository as never,
        userRepository as never,
      );

      const result = await service.findAll({ page: -5 });

      expect(result.page).toBe(1);
      expect(qb.skip).toHaveBeenCalledWith(0);
    });
  });

  describe('deleteUnit', () => {
    it('deletes unit successfully when no active users and no members', async () => {
      const mockUnit = { id: 'unit-1', name: 'Unit A', members: [] };
      const ambulanceUnitRepository = createAmbulanceUnitRepositoryMock();
      ambulanceUnitRepository.findOne.mockResolvedValue(mockUnit);
      ambulanceUnitRepository.remove.mockResolvedValue(undefined);

      const userRepository = createUserRepositoryMock();
      userRepository.count.mockResolvedValue(0);

      const service = new AmbulanceUnitsService(
        ambulanceUnitRepository as never,
        userRepository as never,
      );

      await service.deleteUnit('unit-1');

      expect(ambulanceUnitRepository.remove).toHaveBeenCalledWith(mockUnit);
    });

    it('throws NotFoundException when unit does not exist', async () => {
      const ambulanceUnitRepository = createAmbulanceUnitRepositoryMock();
      ambulanceUnitRepository.findOne.mockResolvedValue(null);

      const userRepository = createUserRepositoryMock();

      const service = new AmbulanceUnitsService(
        ambulanceUnitRepository as never,
        userRepository as never,
      );

      await expect(service.deleteUnit('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when unit has active users', async () => {
      const mockUnit = { id: 'unit-1', name: 'Unit A', members: [] };
      const ambulanceUnitRepository = createAmbulanceUnitRepositoryMock();
      ambulanceUnitRepository.findOne.mockResolvedValue(mockUnit);

      const userRepository = createUserRepositoryMock();
      userRepository.count.mockResolvedValue(5);

      const service = new AmbulanceUnitsService(
        ambulanceUnitRepository as never,
        userRepository as never,
      );

      await expect(service.deleteUnit('unit-1')).rejects.toThrow(
        ConflictException,
      );
      expect(ambulanceUnitRepository.remove).not.toHaveBeenCalled();
    });

    it('throws ConflictException when unit has assigned members', async () => {
      const mockUnit = {
        id: 'unit-1',
        name: 'Unit A',
        members: [{ id: 'user-1' }, { id: 'user-2' }],
      };
      const ambulanceUnitRepository = createAmbulanceUnitRepositoryMock();
      ambulanceUnitRepository.findOne.mockResolvedValue(mockUnit);

      const userRepository = createUserRepositoryMock();
      userRepository.count.mockResolvedValue(0);

      const service = new AmbulanceUnitsService(
        ambulanceUnitRepository as never,
        userRepository as never,
      );

      await expect(service.deleteUnit('unit-1')).rejects.toThrow(
        ConflictException,
      );
      expect(ambulanceUnitRepository.remove).not.toHaveBeenCalled();
    });
  });
});
