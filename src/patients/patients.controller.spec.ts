import { Test, TestingModule } from '@nestjs/testing';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { PatientsImportService } from './patients-import.service';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

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
    importPatients: jest.fn(),
    generateTemplate: jest.fn(),
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

  it('forwards the uploaded file and selected server-side context', async () => {
    const file = { buffer: Buffer.from('workbook') } as Express.Multer.File;
    const context = {
      companyId: '019e79f9-9941-758b-9bd2-18f4d1da9148',
      planId: '019e79f9-9941-758b-9bd2-18f4d1da9149',
    };

    await controller.importPatients(file, context);

    expect(patientsImportServiceMock.importPatients).toHaveBeenCalledWith(
      file,
      context,
    );
  });

  it('restricts template generation and patient import to admins', () => {
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        PatientsController.prototype.generateImportTemplate,
      ),
    ).toEqual([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        PatientsController.prototype.importPatients,
      ),
    ).toEqual([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
  });
});
