/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { CompaniesService } from 'src/companies/services/companies.service';
import { PlansService } from 'src/plans/services/plans.service';
import { PatientsService } from './patients.service';
import { PlanSubscriptionsService } from '../plans/services/plan-subscriptions.service';
import {
  PayerType,
  PlanSubscription,
  PlanSubscriptionStatus,
} from '../plans/entities/plan-subscription.entity';
import { PatientImportErrorCode } from './exeptions/patient-import.exception';
import { DocumentType, Gender, Patient } from './entities/patient.entity';
import { DataSource, EntityManager } from 'typeorm';
import { PlanType } from 'src/plans/entities/plan.entity';

const DOCUMENT_TYPE_MAP = {
  [DocumentType.CC]: 'CC',
  [DocumentType.CE]: 'CE',
  [DocumentType.PASSPORT]: 'Pasaporte',
  [DocumentType.OTHER]: 'Otro',
};

const GENDER_MAP = {
  [Gender.MALE]: 'Masculino',
  [Gender.FEMALE]: 'Femenino',
};

const DOCUMENT_TYPE_REVERSE_MAP: Record<string, DocumentType> = {
  CC: DocumentType.CC,
  CE: DocumentType.CE,
  Pasaporte: DocumentType.PASSPORT,
  Otro: DocumentType.OTHER,
};

const GENDER_REVERSE_MAP: Record<string, Gender> = {
  Masculino: Gender.MALE,
  Femenino: Gender.FEMALE,
};

@Injectable()
export class PatientsImportService {
  constructor(
    private readonly plansService: PlansService,
    private readonly companiesService: CompaniesService,
    private readonly patientsService: PatientsService,
    private readonly planSubscriptionsService: PlanSubscriptionsService,
    private dataSource: DataSource,
  ) {}

  private applyDropdown(
    sheet: ExcelJS.Worksheet,
    columnLetter: string,
    startRow: number,
    endRow: number,
    formula: string,
    allowBlank = true,
  ) {
    for (let row = startRow; row <= endRow; row++) {
      const cell = sheet.getCell(`${columnLetter}${row}`);
      cell.dataValidation = {
        type: 'list',
        allowBlank,
        formulae: [formula],
        showErrorMessage: true,
        errorTitle: 'Valor inválido',
        error: 'Por favor seleccione un valor de la lista',
      };
    }
  }

  async generateTemplate(res: Response) {
    const workbook = new ExcelJS.Workbook();

    /* ======================
       Patients sheet
    ====================== */
    const patientsSheet = workbook.addWorksheet('Patients');

    patientsSheet.columns = [
      { header: 'Nombre', key: 'firstName', width: 25 },
      { header: 'Apellido', key: 'lastName', width: 25 },
      { header: 'Tipo de Documento', key: 'documentType', width: 25 },
      { header: 'Número de Documento', key: 'documentNumber', width: 25 },
      { header: 'Fecha de Nacimiento', key: 'birthDate', width: 25 },
      { header: 'Género', key: 'gender', width: 15 },
      { header: 'Teléfono', key: 'phone', width: 18 },
      { header: 'Ciudad', key: 'city', width: 18 },
      { header: 'Plan', key: 'plan', width: 25 },
      { header: 'Empresa', key: 'company', width: 25 },
    ];

    /* ======================
       Plans sheet
    ====================== */
    const plansSheet = workbook.addWorksheet('Planes');
    plansSheet.columns = [
      { header: 'ID', key: 'id', width: 36 },
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Tipo', key: 'planType', width: 20 },
    ];

    const plans = await this.plansService.findAllActive();
    plans.forEach((plan) => plansSheet.addRow(plan));

    /* ======================
       Companies sheet
    ====================== */
    const companiesSheet = workbook.addWorksheet('Empresas');
    companiesSheet.columns = [
      { header: 'ID', key: 'id', width: 36 },
      { header: 'Nombre', key: 'name', width: 30 },
    ];

    const companies = await this.companiesService.findAll();
    companies.forEach((company) => companiesSheet.addRow(company));

    /* ======================
       Metadata sheet
    ====================== */
    const metadataSheet = workbook.addWorksheet('Metadatos');

    metadataSheet.addRow(['TipoDocumento', 'Género']);
    metadataSheet.addRow([
      DOCUMENT_TYPE_MAP[DocumentType.CC],
      GENDER_MAP[Gender.MALE],
    ]);
    metadataSheet.addRow([
      DOCUMENT_TYPE_MAP[DocumentType.CE],
      GENDER_MAP[Gender.FEMALE],
    ]);
    metadataSheet.addRow([DOCUMENT_TYPE_MAP[DocumentType.PASSPORT]]);
    metadataSheet.addRow([DOCUMENT_TYPE_MAP[DocumentType.OTHER]]);

    /* ======================
       Data validation
    ====================== */
    const lastRow = 500;

    // Document Type
    this.applyDropdown(
      patientsSheet,
      'C',
      2,
      lastRow,
      '=Metadatos!$A$2:$A$10',
      false,
    );

    // Gender
    this.applyDropdown(
      patientsSheet,
      'F',
      2,
      lastRow,
      '=Metadatos!$B$2:$B$10',
      true,
    );

    // Plan
    this.applyDropdown(
      patientsSheet,
      'I',
      2,
      lastRow,
      '=Planes!$B$2:$B$100',
      true,
    );

    // Company
    this.applyDropdown(
      patientsSheet,
      'J',
      2,
      lastRow,
      '=Empresas!$B$2:$B$100',
      true,
    );

    /* ======================
       Response
    ====================== */

    await plansSheet.protect('readonly', {});
    await companiesSheet.protect('readonly', {});
    await metadataSheet.protect('readonly', {});

    /* ======================
       Response
    ====================== */
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=patients-import.xlsx',
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  async importPatients(file: Express.Multer.File) {
    if (!file || !file.buffer || !Buffer.isBuffer(file.buffer)) {
      throw new BadRequestException({
        code: PatientImportErrorCode.FILE_INVALID,
        message: 'Archivo inválido',
      });
    }

    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await workbook.xlsx.load(file.buffer as any);

    const patientsSheet = workbook.getWorksheet('Patients');
    if (!patientsSheet) {
      throw new BadRequestException({
        code: PatientImportErrorCode.SHEET_NOT_FOUND,
        message: 'La hoja "Patients" no existe',
      });
    }

    const plans = await this.plansService.findAllActive();
    const companies = await this.companiesService.findAll();

    const planMap = new Map(plans.map((p) => [p.name, p]));
    const companyMap = new Map(companies.map((c) => [c.name, c]));

    const errors: {
      row: number;
      code: PatientImportErrorCode;
      message: string;
    }[] = [];

    let imported = 0;

    for (let rowNumber = 2; rowNumber <= patientsSheet.rowCount; rowNumber++) {
      const row = patientsSheet.getRow(rowNumber);

      await this.dataSource.transaction(async (manager) => {
        try {
          const patientRepository = manager.getRepository(Patient);
          const planSubscriptionsRepository =
            manager.getRepository(PlanSubscription);

          const getValue = (col: number): string | undefined => {
            const v = row.getCell(col).value;
            if (v === null || v === undefined) return undefined;
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            return v.toString().trim();
          };

          const firstName = getValue(1);
          const lastName = getValue(2);
          const documentTypeStr = getValue(3);
          const documentNumber = getValue(4);
          const birthDateCell = row.getCell(5).value;
          const genderStr = getValue(6);
          const phone = getValue(7);
          const city = getValue(8);
          const planName = getValue(9);
          const companyName = getValue(10);

          if (
            !firstName ||
            !lastName ||
            !documentTypeStr ||
            !documentNumber ||
            !genderStr
          ) {
            // errors.push({
            //   row: rowNumber,
            //   code: PatientImportErrorCode.REQUIRED_FIELDS_MISSING,
            //   message: 'Campos requeridos faltantes',
            // });
            return;
          }

          const documentType = DOCUMENT_TYPE_REVERSE_MAP[documentTypeStr];

          if (!documentType) {
            errors.push({
              row: rowNumber,
              code: PatientImportErrorCode.INVALID_DOCUMENT_TYPE,
              message: 'Tipo de documento inválido',
            });
            return;
          }

          const gender = GENDER_REVERSE_MAP[genderStr];

          if (!gender) {
            errors.push({
              row: rowNumber,
              code: PatientImportErrorCode.INVALID_GENDER,
              message: 'Género inválido',
            });
            return;
          }

          let birthDate: Date | undefined;
          if (birthDateCell) {
            const parsed =
              birthDateCell instanceof Date
                ? birthDateCell
                : // eslint-disable-next-line @typescript-eslint/no-base-to-string
                  new Date(birthDateCell.toString());

            if (isNaN(parsed.getTime())) {
              errors.push({
                row: rowNumber,
                code: PatientImportErrorCode.INVALID_BIRTH_DATE,
                message: 'Fecha de nacimiento inválida',
              });
              return;
            }
            birthDate = parsed;
          }

          const existing = await patientRepository.findOne({
            where: { documentNumber },
          });

          if (existing) {
            errors.push({
              row: rowNumber,
              code: PatientImportErrorCode.PATIENT_ALREADY_EXISTS,
              message: 'El paciente ya existe',
            });
            return;
          }

          const patient = patientRepository.create({
            firstName,
            lastName,
            documentType,
            documentNumber,
            gender,
            phone,
            city,
            birthDate,
          });

          await patientRepository.save(patient);

          if (planName) {
            const plan = planMap.get(planName);

            if (!plan) {
              errors.push({
                row: rowNumber,
                code: PatientImportErrorCode.PLAN_NOT_FOUND,
                message: 'Plan no encontrado',
              });
              throw new Error(); // rollback fila
            }

            if (plan.planType === PlanType.FAMILY) {
              const hasFamilyPlan = await this.hasActiveFamilyPlan(
                patient.id,
                manager,
              );

              if (hasFamilyPlan) {
                errors.push({
                  row: rowNumber,
                  code: PatientImportErrorCode.MULTIPLE_FAMILY_PLANS,
                  message: 'El paciente ya tiene un plan familiar activo',
                });
                throw new Error();
              }
            }

            let companyId: string | null = null;

            if (companyName) {
              const company = companyMap.get(companyName);
              if (!company) {
                errors.push({
                  row: rowNumber,
                  code: PatientImportErrorCode.COMPANY_NOT_FOUND,
                  message: 'Empresa no encontrada',
                });
                throw new Error();
              }
              companyId = company.id;
            }

            const planSubscription = planSubscriptionsRepository.create({
              payerType: PayerType.PATIENT,
              startDate: new Date(),
            });

            planSubscription.patient = patient;

            planSubscription.plan = plan;

            if (companyId) {
              const company = await this.companiesService.findOne(companyId);
              planSubscription.company = company;
            }

            await planSubscriptionsRepository.save(planSubscription);
          }

          imported++;
        } catch {
          // rollback automático de la transacción
        }
      });
    }

    return {
      imported,
      failed: errors.length,
      errors,
    };
  }

  private async hasActiveFamilyPlan(
    patientId: string,
    manager: EntityManager,
  ): Promise<boolean> {
    const planSubscriptionsRepository = manager.getRepository(PlanSubscription);

    const count = await planSubscriptionsRepository
      .createQueryBuilder('ps')
      .innerJoin('ps.plan', 'plan')
      .where('plan.planType = :planType', { planType: PlanType.FAMILY })
      .andWhere('(ps.patientId = :patientId)', { patientId })
      .andWhere('ps.status IN (:...statuses)', {
        statuses: [
          PlanSubscriptionStatus.ACTIVE,
          PlanSubscriptionStatus.SUSPENDED,
        ],
      })
      .getCount();

    return count > 0;
  }
}
