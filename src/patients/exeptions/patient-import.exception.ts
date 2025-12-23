import { HttpException, HttpStatus } from '@nestjs/common';

export enum PatientImportErrorCode {
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  FILE_INVALID = 'PATIENT_IMPORT_FILE_INVALID',
  SHEET_NOT_FOUND = 'PATIENT_IMPORT_SHEET_NOT_FOUND',
  REQUIRED_FIELDS_MISSING = 'PATIENT_IMPORT_REQUIRED_FIELDS_MISSING',
  INVALID_DOCUMENT_TYPE = 'PATIENT_IMPORT_INVALID_DOCUMENT_TYPE',
  INVALID_GENDER = 'PATIENT_IMPORT_INVALID_GENDER',
  INVALID_BIRTH_DATE = 'PATIENT_IMPORT_INVALID_BIRTH_DATE',
  PATIENT_ALREADY_EXISTS = 'PATIENT_IMPORT_PATIENT_ALREADY_EXISTS',
  PLAN_NOT_FOUND = 'PATIENT_IMPORT_PLAN_NOT_FOUND',
  COMPANY_NOT_FOUND = 'PATIENT_IMPORT_COMPANY_NOT_FOUND',
  MULTIPLE_FAMILY_PLANS = 'PATIENT_IMPORT_MULTIPLE_FAMILY_PLANS',
  ROW_PROCESSING_ERROR = 'PATIENT_IMPORT_ROW_ERROR',
}

export class PatientImportException extends HttpException {
  constructor(
    message: string,
    public readonly errorCode: PatientImportErrorCode,
    public readonly meta?: Record<string, any>,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        message,
        errorCode,
        meta,
        statusCode: status,
      },
      status,
    );
  }
}
