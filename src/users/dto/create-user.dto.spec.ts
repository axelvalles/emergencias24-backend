import { validateSync } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UserRole } from '../entities/user.entity';

describe('CreateUserDto', () => {
  function buildDto(role: UserRole): CreateUserDto {
    const dto = new CreateUserDto();
    dto.email = 'paramedic@example.com';
    dto.password = 'secret123';
    dto.firstName = 'Pat';
    dto.lastName = 'Medic';
    dto.role = role;

    return dto;
  }

  it('accepts the new operational roles', () => {
    const paramedicErrors = validateSync(buildDto(UserRole.PARAMEDIC));
    const doctorErrors = validateSync(buildDto(UserRole.DOCTOR));
    const appointmentManagerErrors = validateSync(
      buildDto(UserRole.APPOINTMENT_MANAGER),
    );
    const marketingErrors = validateSync(buildDto(UserRole.MARKETING));

    expect(paramedicErrors).toHaveLength(0);
    expect(doctorErrors).toHaveLength(0);
    expect(appointmentManagerErrors).toHaveLength(0);
    expect(marketingErrors).toHaveLength(0);
  });
});
