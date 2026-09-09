import { BadRequestException, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { PatientImportErrorCode } from './exeptions/patient-import.exception';
import { DocumentType, Gender, Patient } from './entities/patient.entity';
import { DataSource } from 'typeorm';

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

const BATCH_SIZE = 100;

@Injectable()
export class PatientsImportService {
  constructor(private dataSource: DataSource) {}

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
    ];

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
    const workbookBuffer = file.buffer as unknown as Parameters<
      typeof workbook.xlsx.load
    >[0];
    await workbook.xlsx.load(workbookBuffer);

    const patientsSheet = workbook.getWorksheet('Patients');
    if (!patientsSheet) {
      throw new BadRequestException({
        code: PatientImportErrorCode.SHEET_NOT_FOUND,
        message: 'La hoja "Patients" no existe',
      });
    }

    const errors: {
      row: number;
      code: PatientImportErrorCode;
      message: string;
    }[] = [];

    let imported = 0;

    // Process in chunks for transaction batching
    const rowNumbers: number[] = [];
    for (let rowNumber = 2; rowNumber <= patientsSheet.rowCount; rowNumber++) {
      rowNumbers.push(rowNumber);
    }

    // Process in batches
    for (let i = 0; i < rowNumbers.length; i += BATCH_SIZE) {
      const batchRows = rowNumbers.slice(i, i + BATCH_SIZE);

      await this.dataSource.transaction(async (manager) => {
        for (const rowNumber of batchRows) {
          const row = patientsSheet.getRow(rowNumber);

          try {
            const patientRepository = manager.getRepository(Patient);

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

            if (
              !firstName ||
              !lastName ||
              !documentTypeStr ||
              !documentNumber ||
              !genderStr
            ) {
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

            imported++;
          } catch {
            // rollback automático de la transacción
          }
        }
      });
    }

    return {
      imported,
      failed: errors.length,
      errors,
    };
  }
}
