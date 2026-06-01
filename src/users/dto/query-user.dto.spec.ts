import { validateSync } from 'class-validator';
import { QueryUserDto } from './query-user.dto';

describe('QueryUserDto', () => {
  it('accepts allowlisted sort fields and order', () => {
    const dto = new QueryUserDto();
    dto.sortBy = 'email';
    dto.sortOrder = 'DESC';

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects non-allowlisted sort fields', () => {
    const dto = new QueryUserDto();
    dto.sortBy = '1=1';

    const errors = validateSync(dto);

    expect(errors.some((error) => error.property === 'sortBy')).toBe(true);
  });
});
