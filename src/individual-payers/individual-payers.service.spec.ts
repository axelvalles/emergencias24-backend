import { ConflictException, NotFoundException } from '@nestjs/common';
import { DocumentType } from '../patients/entities/patient.entity';
import { IndividualPayersService } from './individual-payers.service';

describe('IndividualPayersService', () => {
  function createQueryBuilderMock() {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn(),
      andWhere: jest.fn(),
      addOrderBy: jest.fn(),
      skip: jest.fn(),
      take: jest.fn(),
      getManyAndCount: jest.fn(),
    };

    for (const method of [
      'leftJoinAndSelect',
      'andWhere',
      'addOrderBy',
      'skip',
      'take',
    ] as const) {
      queryBuilder[method].mockReturnValue(queryBuilder);
    }

    return queryBuilder;
  }

  function createPayerRepositoryMock() {
    return {
      create: jest.fn((value: object) => value),
      save: jest.fn((value: object) => Promise.resolve(value)),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
  }

  function createPatientRepositoryMock() {
    return {
      findOne: jest.fn(),
    };
  }

  const baseDto = {
    firstName: ' Ana ',
    lastName: ' Pérez ',
    documentType: DocumentType.CC,
    documentNumber: ' 123456 ',
    phone: ' 3000000000 ',
    email: ' ANA@EXAMPLE.COM ',
  };

  const linkedPatient = {
    id: '0199f376-0b8a-7000-8000-000000000001',
    firstName: 'María',
    lastName: 'Pérez',
    documentType: DocumentType.CC,
    allergies: 'Penicillin',
    medicalConditions: 'Hypertension',
    documentNumber: '123456',
  };

  const minimalLinkedPatient = {
    id: linkedPatient.id,
    firstName: linkedPatient.firstName,
    lastName: linkedPatient.lastName,
    fullName: 'María Pérez',
  };

  it('creates a payer without requiring or creating a patient', async () => {
    const payerRepository = createPayerRepositoryMock();
    payerRepository.findOne.mockResolvedValue(null);
    const patientRepository = createPatientRepositoryMock();
    const service = new IndividualPayersService(
      payerRepository as never,
      patientRepository as never,
    );

    const result = await service.create(baseDto);

    expect(patientRepository.findOne).not.toHaveBeenCalled();
    expect(payerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Ana',
        lastName: 'Pérez',
        documentNumber: '123456',
        phone: '3000000000',
        email: 'ana@example.com',
        linkedPatient: null,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({ documentNumber: '123456' }),
    );
  });

  it('links an existing patient when explicitly requested', async () => {
    const payerRepository = createPayerRepositoryMock();
    payerRepository.findOne.mockResolvedValue(null);
    const patientRepository = createPatientRepositoryMock();
    patientRepository.findOne.mockResolvedValue(linkedPatient);
    const service = new IndividualPayersService(
      payerRepository as never,
      patientRepository as never,
    );

    const result = await service.create({
      ...baseDto,
      linkedPatientId: linkedPatient.id,
    });

    expect(patientRepository.findOne).toHaveBeenCalledWith({
      where: { id: linkedPatient.id },
    });
    expect(payerRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ linkedPatient }),
    );
    expect(result.linkedPatient).toEqual(minimalLinkedPatient);
    expect(result.linkedPatient).not.toHaveProperty('allergies');
    expect(result.linkedPatient).not.toHaveProperty('medicalConditions');
    expect(result.linkedPatient).not.toHaveProperty('documentNumber');
  });

  it('rejects a missing linked patient', async () => {
    const payerRepository = createPayerRepositoryMock();
    payerRepository.findOne.mockResolvedValue(null);
    const patientRepository = createPatientRepositoryMock();
    patientRepository.findOne.mockResolvedValue(null);
    const service = new IndividualPayersService(
      payerRepository as never,
      patientRepository as never,
    );

    await expect(
      service.create({
        ...baseDto,
        linkedPatientId: '0199f376-0b8a-7000-8000-000000000001',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects linking a patient with a different document number on create', async () => {
    const payerRepository = createPayerRepositoryMock();
    payerRepository.findOne.mockResolvedValue(null);
    const patientRepository = createPatientRepositoryMock();
    patientRepository.findOne.mockResolvedValue({
      ...linkedPatient,
      documentNumber: '654321',
    });
    const service = new IndividualPayersService(
      payerRepository as never,
      patientRepository as never,
    );

    await expect(
      service.create({
        ...baseDto,
        linkedPatientId: linkedPatient.id,
      }),
    ).rejects.toThrow(ConflictException);

    expect(payerRepository.save).not.toHaveBeenCalled();
  });

  it('rejects linking a patient with a different document type on update', async () => {
    const payer = {
      id: 'payer-1',
      firstName: 'Ana',
      lastName: 'Pérez',
      documentType: DocumentType.CC,
      documentNumber: '123456',
      linkedPatient: null,
    };
    const payerRepository = createPayerRepositoryMock();
    payerRepository.findOne.mockResolvedValue(payer);
    const patientRepository = createPatientRepositoryMock();
    patientRepository.findOne.mockResolvedValue({
      ...linkedPatient,
      documentType: DocumentType.CE,
    });
    const service = new IndividualPayersService(
      payerRepository as never,
      patientRepository as never,
    );

    await expect(
      service.update('payer-1', { linkedPatientId: linkedPatient.id }),
    ).rejects.toThrow(ConflictException);

    expect(payerRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a duplicate payer document', async () => {
    const payerRepository = createPayerRepositoryMock();
    payerRepository.findOne.mockResolvedValue({ id: 'payer-1' });
    const service = new IndividualPayersService(
      payerRepository as never,
      createPatientRepositoryMock() as never,
    );

    await expect(service.create(baseDto)).rejects.toThrow(ConflictException);
  });

  it('maps a concurrent document unique-index violation to conflict', async () => {
    const payerRepository = createPayerRepositoryMock();
    payerRepository.findOne.mockResolvedValue(null);
    payerRepository.save.mockRejectedValue({
      driverError: {
        code: '23505',
        constraint: 'IDX_INDIVIDUAL_PAYERS_DOCUMENT_NUMBER',
      },
    });
    const service = new IndividualPayersService(
      payerRepository as never,
      createPatientRepositoryMock() as never,
    );

    await expect(service.create(baseDto)).rejects.toThrow(ConflictException);
  });

  it('clears an optional patient link during update', async () => {
    const payer = {
      id: 'payer-1',
      firstName: 'Ana',
      lastName: 'Pérez',
      documentNumber: '123456',
      linkedPatient: { id: 'patient-1' },
    };
    const payerRepository = createPayerRepositoryMock();
    payerRepository.findOne.mockResolvedValue(payer);
    const service = new IndividualPayersService(
      payerRepository as never,
      createPatientRepositoryMock() as never,
    );

    const result = await service.update('payer-1', { linkedPatientId: null });

    expect(result.linkedPatient).toBeNull();
    expect(payerRepository.save).toHaveBeenCalledWith(payer);
  });

  it('returns a searchable paginated list', async () => {
    const queryBuilder = createQueryBuilderMock();
    queryBuilder.getManyAndCount.mockResolvedValue([
      [
        {
          id: 'payer-1',
          firstName: 'Ana',
          lastName: 'Pérez',
          linkedPatient,
        },
      ],
      1,
    ]);
    const payerRepository = createPayerRepositoryMock();
    payerRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    const service = new IndividualPayersService(
      payerRepository as never,
      createPatientRepositoryMock() as never,
    );

    const result = await service.findAll({ q: 'ana', page: 1, limit: 10 });

    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      'individualPayer.linkedPatient',
      'linkedPatient',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalled();
    expect(result).toEqual({
      data: [
        {
          id: 'payer-1',
          firstName: 'Ana',
          lastName: 'Pérez',
          fullName: 'Ana Pérez',
          linkedPatient: minimalLinkedPatient,
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    expect(result.data[0].linkedPatient).not.toHaveProperty('allergies');
    expect(result.data[0].linkedPatient).not.toHaveProperty(
      'medicalConditions',
    );
  });

  it('projects linked patient data from get without clinical fields', async () => {
    const payerRepository = createPayerRepositoryMock();
    payerRepository.findOne.mockResolvedValue({
      id: 'payer-1',
      firstName: 'Ana',
      lastName: 'Pérez',
      linkedPatient,
    });
    const service = new IndividualPayersService(
      payerRepository as never,
      createPatientRepositoryMock() as never,
    );

    const result = await service.findOne('payer-1');

    expect(result.linkedPatient).toEqual(minimalLinkedPatient);
    expect(result.linkedPatient).not.toHaveProperty('allergies');
    expect(result.linkedPatient).not.toHaveProperty('medicalConditions');
  });

  it('projects linked patient data from update without clinical fields', async () => {
    const payer = {
      id: 'payer-1',
      firstName: 'Ana',
      lastName: 'Pérez',
      documentNumber: '123456',
      linkedPatient,
    };
    const payerRepository = createPayerRepositoryMock();
    payerRepository.findOne.mockResolvedValue(payer);
    const service = new IndividualPayersService(
      payerRepository as never,
      createPatientRepositoryMock() as never,
    );

    const result = await service.update('payer-1', { firstName: 'Ana María' });

    expect(result.linkedPatient).toEqual(minimalLinkedPatient);
    expect(result.linkedPatient).not.toHaveProperty('allergies');
    expect(result.linkedPatient).not.toHaveProperty('medicalConditions');
  });
});
