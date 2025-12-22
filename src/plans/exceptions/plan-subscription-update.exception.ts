import { HttpException, HttpStatus } from '@nestjs/common';

export enum PlanSubscriptionUpdateErrorCode {
  SUBSCRIPTION_NOT_FOUND = 'SUBSCRIPTION_NOT_FOUND',

  // Cambios no permitidos
  PATIENT_CHANGE_NOT_ALLOWED = 'PATIENT_CHANGE_NOT_ALLOWED',
  PLAN_CHANGE_NOT_ALLOWED = 'PLAN_CHANGE_NOT_ALLOWED',

  // Reglas de negocio
  PLAN_ALREADY_ASSIGNED = 'PLAN_ALREADY_ASSIGNED',
  PATIENT_ALREADY_HAS_FAMILY_PLAN = 'PATIENT_ALREADY_HAS_FAMILY_PLAN',

  // Estados
  INVALID_STATUS_TRANSITION = 'INVALID_STATUS_TRANSITION',

  // Fechas
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
}

export class PlanSubscriptionUpdateException extends HttpException {
  constructor(
    message: string,
    public readonly errorCode: PlanSubscriptionUpdateErrorCode,
  ) {
    super(
      {
        message,
        errorCode,
        statusCode: HttpStatus.BAD_REQUEST,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
