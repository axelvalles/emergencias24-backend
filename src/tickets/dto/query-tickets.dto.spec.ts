import { validateSync } from 'class-validator';
import { QueryTicketsDto } from './query-tickets.dto';

describe('QueryTicketsDto', () => {
  it('accepts allowlisted sort fields and order', () => {
    const dto = new QueryTicketsDto();
    dto.sortBy = 'priority';
    dto.sortOrder = 'ASC';

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects non-allowlisted sort fields', () => {
    const dto = new QueryTicketsDto();
    dto.sortBy = 'drop table';

    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'sortBy')).toBe(true);
  });
});
