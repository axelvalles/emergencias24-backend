import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DocumentType } from '../../patients/entities/patient.entity';
import { CreateIndividualPayerDto } from './create-individual-payer.dto';
import { QueryIndividualPayersDto } from './query-individual-payers.dto';
import { UpdateIndividualPayerDto } from './update-individual-payer.dto';

describe('Individual payer DTOs', () => {
  it('accepts a payer without a patient link', async () => {
    const dto = plainToInstance(CreateIndividualPayerDto, {
      firstName: 'Ana',
      lastName: 'Pérez',
      documentType: DocumentType.CC,
      documentNumber: '123456',
      email: 'ana@example.com',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects an invalid optional patient link', async () => {
    const dto = plainToInstance(CreateIndividualPayerDto, {
      firstName: 'Ana',
      lastName: 'Pérez',
      documentType: DocumentType.CC,
      documentNumber: '123456',
      linkedPatientId: 'not-a-uuid',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'linkedPatientId')).toBe(
      true,
    );
  });

  it.each(['firstName', 'lastName', 'documentNumber'] as const)(
    'rejects whitespace-only %s on create',
    async (field) => {
      const dto = plainToInstance(CreateIndividualPayerDto, {
        firstName: 'Ana',
        lastName: 'Pérez',
        documentType: DocumentType.CC,
        documentNumber: '123456',
        [field]: '   ',
      });

      const errors = await validate(dto);

      expect(errors.some((error) => error.property === field)).toBe(true);
    },
  );

  it('rejects a whitespace-only required field on update', async () => {
    const dto = plainToInstance(UpdateIndividualPayerDto, {
      firstName: '   ',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'firstName')).toBe(true);
  });

  it.each(['firstName', 'lastName', 'documentNumber'] as const)(
    'rejects null %s on update',
    async (field) => {
      const dto = plainToInstance(UpdateIndividualPayerDto, {
        [field]: null,
      });

      const errors = await validate(dto);

      expect(errors.some((error) => error.property === field)).toBe(true);
    },
  );

  it('allows null linkedPatientId on update to unlink a patient', async () => {
    const dto = plainToInstance(UpdateIndividualPayerDto, {
      linkedPatientId: null,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('transforms pagination query values and caps invalid sort fields', async () => {
    const dto = plainToInstance(QueryIndividualPayersDto, {
      page: '2',
      limit: '20',
      sortBy: 'unknown',
    });

    const errors = await validate(dto);

    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(20);
    expect(errors.some((error) => error.property === 'sortBy')).toBe(true);
  });
});
