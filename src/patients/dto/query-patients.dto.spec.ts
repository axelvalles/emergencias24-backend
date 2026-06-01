import { validateSync } from 'class-validator';
import { QueryPatientsDto } from './query-patients.dto';

describe('QueryPatientsDto', () => {
  it('accepts allowlisted sort fields and order', () => {
    const dto = new QueryPatientsDto();
    dto.sortBy = 'fullName';
    dto.sortOrder = 'ASC';

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects non-allowlisted sort fields', () => {
    const dto = new QueryPatientsDto();
    dto.sortBy = 'unsafe_sql';

    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'sortBy')).toBe(true);
  });
});
