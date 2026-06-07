import 'reflect-metadata';
import { validateSync } from 'class-validator';
import { QueryAmbulanceUnitsDto } from './query-ambulance-units.dto';

describe('QueryAmbulanceUnitsDto', () => {
  describe('pagination', () => {
    it('accepts valid page and limit values', () => {
      const dto = new QueryAmbulanceUnitsDto();
      dto.page = 2;
      dto.limit = 25;

      const errors = validateSync(dto);

      expect(errors).toHaveLength(0);
    });

    it('rejects page less than 1', () => {
      const dto = new QueryAmbulanceUnitsDto();
      dto.page = 0;

      const errors = validateSync(dto);

      expect(errors.some((error) => error.property === 'page')).toBe(true);
    });

    it('rejects limit greater than 100', () => {
      const dto = new QueryAmbulanceUnitsDto();
      dto.limit = 150;

      const errors = validateSync(dto);

      expect(errors.some((error) => error.property === 'limit')).toBe(true);
    });

    it('uses default values when not provided', () => {
      const dto = new QueryAmbulanceUnitsDto();

      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
      expect(dto.sortBy).toBe('name');
      expect(dto.sortOrder).toBe('ASC');
    });
  });

  describe('sorting', () => {
    it('accepts allowlisted sort fields name and createdAt', () => {
      const dtoByName = new QueryAmbulanceUnitsDto();
      dtoByName.sortBy = 'name';
      expect(validateSync(dtoByName)).toHaveLength(0);

      const dtoByCreatedAt = new QueryAmbulanceUnitsDto();
      dtoByCreatedAt.sortBy = 'createdAt';
      expect(validateSync(dtoByCreatedAt)).toHaveLength(0);
    });

    it('rejects non-allowlisted sort fields', () => {
      const dto = new QueryAmbulanceUnitsDto();
      dto.sortBy = 'invalidField';

      const errors = validateSync(dto);

      expect(errors.some((error) => error.property === 'sortBy')).toBe(true);
    });

    it('accepts ASC and DESC sort order', () => {
      const dtoAsc = new QueryAmbulanceUnitsDto();
      dtoAsc.sortOrder = 'ASC';
      expect(validateSync(dtoAsc)).toHaveLength(0);

      const dtoDesc = new QueryAmbulanceUnitsDto();
      dtoDesc.sortOrder = 'DESC';
      expect(validateSync(dtoDesc)).toHaveLength(0);
    });

    it('rejects invalid sort order values', () => {
      const dto = new QueryAmbulanceUnitsDto();
      dto.sortOrder = 'INVALID' as 'ASC' | 'DESC';

      const errors = validateSync(dto);

      expect(errors.some((error) => error.property === 'sortOrder')).toBe(true);
    });
  });

  describe('search', () => {
    it('accepts a search term', () => {
      const dto = new QueryAmbulanceUnitsDto();
      dto.q = 'ambulance';

      const errors = validateSync(dto);

      expect(errors).toHaveLength(0);
    });

    it('allows empty search term', () => {
      const dto = new QueryAmbulanceUnitsDto();
      dto.q = '';

      const errors = validateSync(dto);

      expect(errors).toHaveLength(0);
    });
  });
});