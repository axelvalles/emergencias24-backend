import { validateSync } from 'class-validator';
import { QueryTicketsDto } from './query-tickets.dto';
import { ServiceType } from '../entities/ticket.entity';

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

  it('accepts the expanded service taxonomy filters', () => {
    const dto = new QueryTicketsDto();
    dto.serviceType = [
      ServiceType.IMAGING,
      ServiceType.STUDY_TRANSFER,
      ServiceType.APPOINTMENT,
      ServiceType.EQUIPMENT_RENTAL,
    ];

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
  });
});
