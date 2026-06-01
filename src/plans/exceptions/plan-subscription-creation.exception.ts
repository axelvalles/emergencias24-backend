import { HttpException, HttpStatus } from '@nestjs/common';

export enum PlanSubscriptionCreationErrorCode {
  PLAN_ALREADY_ASSIGNED = 'PLAN_ALREADY_ASSIGNED',
  PATIENT_ALREADY_HAS_FAMILY_PLAN = 'PATIENT_ALREADY_HAS_FAMILY_PLAN',
  PATIENT_ALREADY_HAS_PLAN_TYPE = 'PATIENT_ALREADY_HAS_PLAN_TYPE',
}

export class PlanSubscriptionCreationException extends HttpException {
  constructor(
    message: string,
    public readonly errorCode: PlanSubscriptionCreationErrorCode,
    public readonly meta?: Record<string, unknown>,
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
