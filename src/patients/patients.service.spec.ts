import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PatientsService } from './patients.service';
import { Patient } from './entities/patient.entity';
import { Company } from '../companies/entities/company.entity';

describe('PatientsService', () => {
  let service: PatientsService;

  const patientRepositoryMock = {
    create: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const companyRepositoryMock = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: getRepositoryToken(Patient),
          useValue: patientRepositoryMock,
        },
        {
          provide: getRepositoryToken(Company),
          useValue: companyRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
