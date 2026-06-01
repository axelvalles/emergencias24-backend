import { Test, TestingModule } from '@nestjs/testing';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { PatientsImportService } from './patients-import.service';

describe('PatientsController', () => {
  let controller: PatientsController;

  const patientsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByDocument: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateStatus: jest.fn(),
  };

  const patientsImportServiceMock = {
    importFromExcel: jest.fn(),
    getTemplate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        { provide: PatientsService, useValue: patientsServiceMock },
        { provide: PatientsImportService, useValue: patientsImportServiceMock },
      ],
    }).compile();

    controller = module.get<PatientsController>(PatientsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
