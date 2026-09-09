import * as ExcelJS from 'exceljs';
import { PassThrough } from 'stream';
import { Response } from 'express';
import { PatientsImportService } from './patients-import.service';
import { Patient } from './entities/patient.entity';

describe('PatientsImportService', () => {
  const dataSource = {
    transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createService() {
    return new PatientsImportService(dataSource as never);
  }

  async function generateTemplateWorkbook() {
    const response = new PassThrough();
    const chunks: Buffer[] = [];
    response.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    Object.assign(response, { setHeader: jest.fn() });

    await createService().generateTemplate(response as unknown as Response);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.concat(chunks) as never);
    return workbook;
  }

  it('generates a patient-only template with identity and contact headers', async () => {
    const workbook = await generateTemplateWorkbook();
    const patientsSheet = workbook.getWorksheet('Patients');

    expect(patientsSheet).toBeDefined();
    expect(
      (patientsSheet?.getRow(1).values as ExcelJS.CellValue[]).slice(1),
    ).toEqual([
      'Nombre',
      'Apellido',
      'Tipo de Documento',
      'Número de Documento',
      'Fecha de Nacimiento',
      'Género',
      'Teléfono',
      'Ciudad',
    ]);
  });

  it('omits plan and company lookup sheets and validations', async () => {
    const workbook = await generateTemplateWorkbook();
    const patientsSheet = workbook.getWorksheet('Patients');

    expect(workbook.getWorksheet('Planes')).toBeUndefined();
    expect(workbook.getWorksheet('Empresas')).toBeUndefined();
    expect(patientsSheet?.getCell('I2').dataValidation).toBeUndefined();
    expect(patientsSheet?.getCell('J2').dataValidation).toBeUndefined();
  });

  it('imports legacy 10-column workbooks as patient-only data', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Patients');
    sheet.addRow([
      'Nombre',
      'Apellido',
      'Tipo de Documento',
      'Número de Documento',
      'Fecha de Nacimiento',
      'Género',
      'Teléfono',
      'Ciudad',
      'Plan',
      'Empresa',
    ]);
    sheet.addRow([
      'Ana',
      'Pérez',
      'CC',
      '12345678',
      new Date('1990-01-02T00:00:00.000Z'),
      'Femenino',
      '3001234567',
      'Bogotá',
      'Plan Legacy',
      'Empresa Legacy',
    ]);

    const patientRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => ({ id: 'patient-1', ...value })),
      save: jest.fn(async (value) => value),
    };
    const planSubscriptionRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    const manager = {
      getRepository: jest.fn((entity) =>
        entity === Patient ? patientRepository : planSubscriptionRepository,
      ),
    };
    dataSource.transaction.mockImplementation(async (callback) =>
      callback(manager),
    );
    const buffer = await workbook.xlsx.writeBuffer();
    const result = await createService().importPatients({
      buffer: Buffer.from(buffer),
    } as Express.Multer.File);

    expect(result).toEqual({ imported: 1, failed: 0, errors: [] });
    expect(patientRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Ana',
        documentNumber: '12345678',
        phone: '3001234567',
        city: 'Bogotá',
      }),
    );
    expect(manager.getRepository).toHaveBeenCalledTimes(1);
    expect(manager.getRepository).toHaveBeenCalledWith(Patient);
    expect(planSubscriptionRepository.create).not.toHaveBeenCalled();
    expect(planSubscriptionRepository.save).not.toHaveBeenCalled();
  });
});
