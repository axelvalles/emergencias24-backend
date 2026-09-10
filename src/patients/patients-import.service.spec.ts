import * as ExcelJS from 'exceljs';
import { PassThrough } from 'stream';
import { Response } from 'express';
import { PatientsImportService } from './patients-import.service';
import { Patient } from './entities/patient.entity';
import { Company, CompanyStatus } from '../companies/entities/company.entity';
import { Plan, PlanStatus } from '../plans/entities/plan.entity';
import {
  PayerType,
  PlanSubscription,
  PlanSubscriptionStatus,
} from '../plans/entities/plan-subscription.entity';
import { PatientImportErrorCode } from './exeptions/patient-import.exception';

describe('PatientsImportService', () => {
  const companyId = '019e79f9-9941-758b-9bd2-18f4d1da9148';
  const planId = '019e79f9-9941-758b-9bd2-18f4d1da9149';
  const company = { id: companyId, status: CompanyStatus.ACTIVE } as Company;
  const plan = { id: planId, status: PlanStatus.ACTIVE } as Plan;

  const companyRepository = { findOne: jest.fn() };
  const planRepository = { findOne: jest.fn() };
  const dataSource = {
    getRepository: jest.fn((entity) =>
      entity === Company ? companyRepository : planRepository,
    ),
    transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    companyRepository.findOne.mockResolvedValue(company);
    planRepository.findOne.mockResolvedValue(plan);
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

  const validPatientRow = [
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
  ];

  async function createLegacyWorkbookFile(rows = [validPatientRow]) {
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
    rows.forEach((row) => sheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    return { buffer: Buffer.from(buffer) } as Express.Multer.File;
  }

  function configurePersistence(
    subscriptionSave = jest.fn(async (value) => value),
  ) {
    const patientRepository = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value) => ({ id: 'patient-1', ...value })),
      save: jest.fn(async (value) => value),
    };
    const planSubscriptionRepository = {
      create: jest.fn((value) => value),
      save: subscriptionSave,
    };
    const rowManager = {
      getRepository: jest.fn((entity) =>
        entity === Patient ? patientRepository : planSubscriptionRepository,
      ),
    };
    const batchManager = {
      transaction: jest.fn(async (callback) => callback(rowManager)),
    };
    dataSource.transaction.mockImplementation(async (callback) =>
      callback(batchManager),
    );

    return {
      patientRepository,
      planSubscriptionRepository,
      batchManager,
    };
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

  it('omits company and plan catalogs from the workbook', async () => {
    const workbook = await generateTemplateWorkbook();
    const patientsSheet = workbook.getWorksheet('Patients');

    expect(workbook.getWorksheet('Planes')).toBeUndefined();
    expect(workbook.getWorksheet('Empresas')).toBeUndefined();
    expect(patientsSheet?.getCell('I2').dataValidation).toBeUndefined();
    expect(patientsSheet?.getCell('J2').dataValidation).toBeUndefined();
  });

  it.each([
    ['missing company', null, plan, PatientImportErrorCode.COMPANY_NOT_FOUND],
    [
      'inactive company',
      { ...company, status: CompanyStatus.INACTIVE },
      plan,
      PatientImportErrorCode.COMPANY_NOT_FOUND,
    ],
    ['missing plan', company, null, PatientImportErrorCode.PLAN_NOT_FOUND],
    [
      'inactive plan',
      company,
      { ...plan, status: PlanStatus.INACTIVE },
      PatientImportErrorCode.PLAN_NOT_FOUND,
    ],
  ])(
    'rejects %s before importing rows',
    async (_case, selectedCompany, selectedPlan, code) => {
      companyRepository.findOne.mockResolvedValue(selectedCompany);
      planRepository.findOne.mockResolvedValue(selectedPlan);

      const promise = createService().importPatients(
        await createLegacyWorkbookFile(),
        { companyId, planId },
      );

      await expect(promise).rejects.toMatchObject({
        response: expect.objectContaining({ code }),
      });
      expect(dataSource.transaction).not.toHaveBeenCalled();
    },
  );

  it('ignores legacy company and plan columns and persists the selected subscription context', async () => {
    const { patientRepository, planSubscriptionRepository, batchManager } =
      configurePersistence();

    const result = await createService().importPatients(
      await createLegacyWorkbookFile(),
      { companyId, planId },
    );

    expect(result).toEqual({ imported: 1, failed: 0, errors: [] });
    expect(companyRepository.findOne).toHaveBeenCalledTimes(1);
    expect(planRepository.findOne).toHaveBeenCalledTimes(1);
    expect(batchManager.transaction).toHaveBeenCalledTimes(1);
    expect(patientRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Ana',
        documentNumber: '12345678',
        phone: '3001234567',
        city: 'Bogotá',
        company,
      }),
    );
    expect(planSubscriptionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        patient: expect.objectContaining({ id: 'patient-1' }),
        company,
        plan,
        payerType: PayerType.COMPANY,
        status: PlanSubscriptionStatus.ACTIVE,
      }),
    );
    expect(planSubscriptionRepository.create).not.toHaveBeenCalledWith(
      expect.objectContaining({
        company: 'Empresa Legacy',
        plan: 'Plan Legacy',
      }),
    );
    expect(planSubscriptionRepository.save).toHaveBeenCalledTimes(1);
  });

  it('reports an invalid row and continues importing the remaining batch', async () => {
    const missingRequiredFieldRow = [
      '',
      'Sin nombre',
      'CC',
      '11111111',
      new Date('1985-03-04T00:00:00.000Z'),
      'Masculino',
      '3000000000',
      'Bogotá',
      'Plan Legacy',
      'Empresa Legacy',
    ];
    const laterValidRow = [
      'Luis',
      'Gómez',
      'CC',
      '22222222',
      new Date('1988-05-06T00:00:00.000Z'),
      'Masculino',
      '3110000000',
      'Medellín',
      'Ignored Plan',
      'Ignored Company',
    ];
    const { patientRepository, planSubscriptionRepository, batchManager } =
      configurePersistence();

    const result = await createService().importPatients(
      await createLegacyWorkbookFile([
        missingRequiredFieldRow,
        laterValidRow,
      ]),
      { companyId, planId },
    );

    expect(result).toEqual({
      imported: 1,
      failed: 1,
      errors: [
        {
          row: 2,
          code: PatientImportErrorCode.REQUIRED_FIELDS_MISSING,
          message: 'Faltan campos obligatorios',
        },
      ],
    });
    expect(batchManager.transaction).toHaveBeenCalledTimes(1);
    expect(patientRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Luis',
        documentNumber: '22222222',
        company,
      }),
    );
    expect(planSubscriptionRepository.save).toHaveBeenCalledTimes(1);
  });

  it('preserves duplicate-patient reporting without creating a subscription', async () => {
    const { patientRepository, planSubscriptionRepository } =
      configurePersistence();
    patientRepository.findOne.mockResolvedValue({ id: 'existing-patient' });

    const result = await createService().importPatients(
      await createLegacyWorkbookFile(),
      { companyId, planId },
    );

    expect(result).toEqual({
      imported: 0,
      failed: 1,
      errors: [
        {
          row: 2,
          code: PatientImportErrorCode.PATIENT_ALREADY_EXISTS,
          message: 'El paciente ya existe',
        },
      ],
    });
    expect(patientRepository.save).not.toHaveBeenCalled();
    expect(planSubscriptionRepository.create).not.toHaveBeenCalled();
    expect(planSubscriptionRepository.save).not.toHaveBeenCalled();
  });

  it('reports a failed row when subscription persistence rolls back its row transaction', async () => {
    const subscriptionFailure = new Error('subscription write failed');
    const { patientRepository, batchManager } = configurePersistence(
      jest.fn().mockRejectedValue(subscriptionFailure),
    );

    const result = await createService().importPatients(
      await createLegacyWorkbookFile(),
      { companyId, planId },
    );

    expect(patientRepository.save).toHaveBeenCalledTimes(1);
    expect(batchManager.transaction).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      imported: 0,
      failed: 1,
      errors: [
        {
          row: 2,
          code: PatientImportErrorCode.ROW_PROCESSING_ERROR,
          message: 'No se pudo importar el paciente y su suscripción',
        },
      ],
    });
  });
});
