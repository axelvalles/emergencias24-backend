import { HttpException, HttpStatus } from '@nestjs/common';

export enum PlanSubscriptionCreationErrorCode {
  PLAN_ALREADY_ASSIGNED = 'PLAN_ALREADY_ASSIGNED',
  PATIENT_ALREADY_HAS_FAMILY_PLAN = 'PATIENT_ALREADY_HAS_FAMILY_PLAN',
}

export class PlanSubscriptionCreationException extends HttpException {
  constructor(
    message: string,
    public readonly errorCode: PlanSubscriptionCreationErrorCode,
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
